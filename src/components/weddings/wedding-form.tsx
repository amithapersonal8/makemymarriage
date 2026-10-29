"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useProtectedSession } from "@/components/auth/session-guard";
import { useWeddingDrafts } from "./wedding-draft-provider";
import {
  weddingSchema,
  type WeddingInput,
} from "@/modules/weddings/wedding.schema";
import type { WeddingDto } from "@/modules/weddings/wedding.dto";

const empty: WeddingInput = {
  brideName: "",
  groomName: "",
  title: "",
  startDate: "",
  endDate: "",
  location: "",
  timezone: "Asia/Kolkata",
  description: "",
};
export function WeddingForm({
  wedding,
  timezones,
  userId,
}: {
  wedding?: WeddingDto;
  timezones: string[];
  userId: string;
}) {
  const router = useRouter();
  const { read, save, remove } = useWeddingDrafts();
  const session = useProtectedSession();
  const path = wedding ? `/weddings/${wedding.id}/edit` : "/weddings/new";
  const [restored] = useState(() => read(userId, path));
  const [values, setValues] = useState<WeddingInput>(
    restored?.values ?? wedding ?? empty,
  );
  const [customTitle, setCustomTitle] = useState(
    restored?.customTitle ?? Boolean(wedding),
  );
  const [undecided, setUndecided] = useState(
    restored?.undecided ?? !wedding?.startDate,
  );
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const completed = useRef(false);
  const [expired, setExpired] = useState(false);
  const disabled = pending || expired || session.status !== "valid";
  const fields: (keyof WeddingInput)[] = [
    "brideName",
    "groomName",
    "title",
    "startDate",
    "endDate",
    "location",
    "timezone",
    "description",
  ];
  const dirty = fields.some((key) => values[key] !== (wedding ?? empty)[key]);
  // Save before paint so immediate session loss or unload cannot miss the last edit.
  useLayoutEffect(() => {
    if (completed.current) return;
    if (dirty)
      save(userId, path, {
        values: {
          brideName: values.brideName,
          groomName: values.groomName,
          title: values.title,
          startDate: values.startDate,
          endDate: values.endDate,
          location: values.location,
          timezone: values.timezone,
          description: values.description,
        },
        customTitle,
        undecided,
      });
    else remove(userId, path);
  }, [values, customTitle, undecided, dirty, userId, path, save, remove]);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const summary = useRef<HTMLDivElement>(null);
  const back = wedding ? `/weddings/${wedding.id}` : "/weddings";
  function change(field: keyof WeddingInput, value: string) {
    setError("");
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      if (field === "startDate" || field === "endDate") {
        delete next.startDate;
        delete next.endDate;
      }
      if (!customTitle && (field === "brideName" || field === "groomName"))
        delete next.title;
      return next;
    });
    setValues((previous) => {
      const next = { ...previous, [field]: value };
      if (!customTitle && (field === "brideName" || field === "groomName")) {
        const names = [
          next.brideName.trim().split(/\s+/)[0],
          next.groomName.trim().split(/\s+/)[0],
        ].filter(Boolean);
        next.title = names.length ? `${names.join(" & ")}'s wedding` : "";
      }
      return next;
    });
  }
  function report(message: string, fields: Record<string, string> = {}) {
    setError(message);
    setErrors(fields);
    requestAnimationFrame(() => summary.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || disabled) return;
    const payload = {
      brideName: values.brideName,
      groomName: values.groomName,
      title: values.title,
      startDate: undecided ? "" : values.startDate,
      endDate: undecided ? "" : values.endDate,
      location: values.location,
      timezone: values.timezone,
      description: values.description,
    };
    const parsed = weddingSchema.safeParse(payload);
    if (!parsed.success) {
      report(
        "Check the highlighted details.",
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    setErrors({});
    let navigating = false;
    try {
      // Recheck the account immediately before a mutation, including cookie loss
      // or account switching without a focus/storage notification.
      if (!(await session.validate())) return;
      const response = await fetch(
        wedding ? `/api/v1/weddings/${wedding.id}` : "/api/v1/weddings",
        {
          method: wedding ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Expected-User-Id": userId,
          },
          credentials: "same-origin",
          body: JSON.stringify(parsed.data),
        },
      );
      if (response.status === 401) {
        setExpired(true);
        return;
      }
      const result: unknown = await response.json();
      if (
        response.ok &&
        typeof result === "object" &&
        result !== null &&
        "data" in result &&
        typeof result.data === "object" &&
        result.data !== null &&
        "id" in result.data &&
        typeof result.data.id === "string"
      ) {
        navigating = true;
        completed.current = true;
        remove(userId, path);
        router.push(
          `/weddings/${result.data.id}${wedding ? "?saved=1" : "?created=1"}`,
        );
        router.refresh();
        return;
      }
      const fields: Record<string, string> = {};
      if (
        typeof result === "object" &&
        result !== null &&
        "details" in result &&
        Array.isArray(result.details)
      )
        for (const item of result.details) {
          if (
            item &&
            typeof item === "object" &&
            typeof item.field === "string" &&
            typeof item.message === "string" &&
            item.field in payload
          )
            fields[item.field] = item.message;
        }
      report(
        response.status === 422
          ? "Check the highlighted details."
          : "We couldn’t save your wedding. Your details are still here. Please try again.",
        fields,
      );
    } catch {
      report(
        "We couldn’t reach the server. Your details are still here. Check your connection and try again.",
      );
    } finally {
      if (!navigating) {
        busy.current = false;
        setPending(false);
      }
    }
  }
  function field(
    name: keyof WeddingInput,
    label: string,
    options: {
      required?: boolean;
      type?: string;
      maxLength?: number;
      placeholder?: string;
      help?: string;
    } = {},
  ) {
    return (
      <div className="wedding-field">
        <label htmlFor={name}>
          {label} <span>{options.required ? "(Required)" : "(Optional)"}</span>
        </label>
        <input
          id={name}
          name={name}
          type={options.type ?? "text"}
          value={values[name]}
          required={options.required}
          maxLength={options.maxLength}
          placeholder={options.placeholder}
          disabled={
            disabled ||
            ((name === "startDate" || name === "endDate") && undecided)
          }
          min={
            name === "endDate"
              ? values.startDate || "1900-01-01"
              : options.type === "date"
                ? "1900-01-01"
                : undefined
          }
          max={options.type === "date" ? "2199-12-31" : undefined}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={
            errors[name]
              ? `${name}-error`
              : options.help
                ? `${name}-help`
                : undefined
          }
          onChange={(event) => {
            if (name === "title") setCustomTitle(true);
            change(name, event.target.value);
          }}
        />
        {errors[name] ? (
          <p className="field-error" id={`${name}-error`}>
            {errors[name]}
          </p>
        ) : (
          options.help && (
            <p className="wedding-help" id={`${name}-help`}>
              {options.help}
            </p>
          )
        )}
      </div>
    );
  }
  return (
    <form
      className="wedding-form wedding-card"
      onSubmit={submit}
      noValidate
      aria-busy={pending}
    >
      {dirty && (
        <p className="wedding-note" role="status">
          {restored ? "Your unsaved draft has been restored. " : ""}Your draft
          is kept only in this tab. Refreshing or closing this tab discards it.
        </p>
      )}
      {expired && (
        <div className="wedding-error" role="alert">
          Your session has ended. Your draft is kept in this tab.{" "}
          <Link href="/login">Log in with the same account to continue</Link>.
        </div>
      )}
      {error && (
        <div className="wedding-error" role="alert" tabIndex={-1} ref={summary}>
          <p>{error}</p>
          {Object.entries(errors).length > 0 && (
            <ul>
              {Object.entries(errors).map(([name, message]) => (
                <li key={name}>
                  <a href={`#${name}`}>{message}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <FormSection number="1" title="The couple & wedding title">
        <div className="wedding-fields">
          {field("brideName", "Bride’s full name", {
            required: true,
            maxLength: 100,
            placeholder: "e.g. Ananya Sharma",
          })}
          {field("groomName", "Groom’s full name", {
            required: true,
            maxLength: 100,
            placeholder: "e.g. Aarav Verma",
          })}
        </div>
        {field("title", "Wedding title", {
          required: true,
          maxLength: 160,
          help: "Suggested from your names. You can customise it anytime.",
        })}
      </FormSection>
      <FormSection number="2" title="Celebration dates" optional>
        <p className="wedding-help">
          If your dates are not confirmed yet, you can set them later.
        </p>
        <label className="wedding-check">
          <input
            type="checkbox"
            checked={undecided}
            disabled={disabled}
            onChange={(event) => {
              setUndecided(event.target.checked);
              setError("");
              setErrors((previous) => {
                const next = { ...previous };
                delete next.startDate;
                delete next.endDate;
                return next;
              });
              if (event.target.checked)
                setValues((previous) => ({
                  ...previous,
                  startDate: "",
                  endDate: "",
                }));
            }}
          />{" "}
          Dates aren’t decided yet
        </label>
        <div className="wedding-fields">
          {field("startDate", "Start date", { type: "date" })}
          {field("endDate", "End date", {
            type: "date",
            help: "The same day or later than your start date.",
          })}
        </div>
      </FormSection>
      <FormSection number="3" title="Location & timezone">
        <div className="wedding-fields">
          {field("location", "Primary city or location", {
            maxLength: 200,
            placeholder: "e.g. Udaipur, Rajasthan",
            help: "You can decide this later.",
          })}
          <div className="wedding-field">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              name="timezone"
              value={values.timezone}
              disabled={disabled}
              onChange={(event) => change("timezone", event.target.value)}
              aria-invalid={Boolean(errors.timezone)}
              aria-describedby={
                errors.timezone ? "timezone-error" : "timezone-help"
              }
            >
              {timezones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone === "Asia/Kolkata"
                    ? "India Standard Time (UTC+05:30)"
                    : zone.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            {errors.timezone ? (
              <p className="field-error" id="timezone-error">
                {errors.timezone}
              </p>
            ) : (
              <p className="wedding-help" id="timezone-help">
                Used to display wedding dates and times.
              </p>
            )}
          </div>
        </div>
      </FormSection>
      <FormSection number="4" title="About the celebration" optional>
        <div className="wedding-field">
          <label htmlFor="description">
            Description or personal note <span>(Optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            value={values.description}
            disabled={disabled}
            placeholder="A short note about your celebration…"
            onChange={(event) => change("description", event.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
          />
          {errors.description && (
            <p className="field-error" id="description-error">
              {errors.description}
            </p>
          )}
        </div>
      </FormSection>
      <p className="wedding-note">
        You can update these details anytime from your wedding overview.
      </p>
      <div className="wedding-form-actions">
        <Link
          href={back}
          className="wedding-back"
          onClick={() => {
            completed.current = true;
            remove(userId, path);
          }}
        >
          {wedding ? "Cancel" : "Back to your weddings"}
        </Link>
        <button className="button" disabled={disabled} type="submit">
          {pending
            ? wedding
              ? "Saving changes…"
              : "Creating your wedding…"
            : wedding
              ? "Save changes"
              : "Create wedding →"}
        </button>
      </div>
    </form>
  );
}
function FormSection({
  number,
  title,
  optional,
  children,
}: {
  number: string;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="wedding-form-section">
      <legend>
        <span className="wedding-section-number">{number}</span> {title}{" "}
        {optional && <small>(Optional)</small>}
      </legend>
      {children}
    </fieldset>
  );
}
