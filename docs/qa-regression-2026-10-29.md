# Regression testing — 29 October 2026

Tested the current uncommitted application using the in-app browser at http://127.0.0.1:3000 and the repository checks. This is bounded regression coverage, not a claim that every possible scenario passed.

## Automated validation

- All 28 tests passed: 12 authentication integration tests, nine session synchronization tests, and seven wedding integration tests.
- Lint, type checking, formatting, and production build passed with Node.js 24 and pnpm 10. Sandbox dependency-path access failed initially; the approved outside-sandbox rerun passed.
- Automated coverage includes expired/forged/revoked sessions, disabled accounts, throttling, origin checks, unsafe payloads, safe projections, session synchronization failures/races, atomic wedding creation/rollback, tenant isolation, Owner-only edits, dates and timezones.

## Browser results

- Passed homepage Features navigation and FAQ expansion.
- Passed short-password and mismatched-confirmation errors, signup, automatic sign-in, and empty wedding list.
- Passed required wedding fields, automatic title, create-to-overview, Owner designation, prefilled editing, reversed-date rejection, same-day date saving, timezone change, refresh persistence, optional date/location clearing, populated list, and mobile edit/save.
- Literal script-like text and Unicode in the description rendered as text. The test description was subsequently replaced with an ordinary QA note.
- Overview had no horizontal overflow at widths 320, 390, 768, 1024, and 1440; the mobile overview was visually inspected. This is not coverage of every route at every breakpoint.
- Passed incorrect-password rejection and subsequent correct login.
- Passed second-account list isolation and denial of direct overview/edit URLs for the first account's wedding.
- Passed signed-in login/signup redirects and the legacy account redirect to the wedding list.
- Passed cross-tab logout with the wedding editor open, removal of editor contents, refresh after logout, and signed-out protected overview denial.
- The browser tool's date fill changed the DOM value without updating the controlled form. Keyboard arrow changes triggered the change handler; date validation and persistence then passed. This was not classified as an application defect.

## Requested draft-recovery scenarios

1. **Expiry preserves draft and disables submission: not implemented in inspected code; live timed expiry not exercised.** SessionGuard replaces the form with a status screen while checking and redirects to login when invalid. WeddingForm keeps draft values in component state. Existing automated tests prove expired-session rejection, not draft preservation. A live cross-tab logout session-loss test discarded the draft and redirected to login, rather than retaining a disabled draft.
2. **Same-user continuation: failed for the tested session-loss flow.** After filling an unsaved creation form and logging out elsewhere, signing back in as the same user led to the wedding list. Reopening creation showed empty fields.
3. **Different account clears draft: passed for the tested session-loss/account-switch flow.** The different user saw an empty list and a blank creation form; no previous user's draft was displayed. Because all drafts are currently discarded, this does not prove selective recovery logic exists.
4. **Refresh/close warning: absent.** No draft-retention notice explaining that refreshing or closing the tab discards the draft appeared in the tested form/login flow or the inspected session/form implementation.

No application fixes were made during this run. Draft-preserving reauthentication requires implementation and focused regression tests, including actual expiry, same-user restoration, different-user clearing, and refresh/close behavior.

## Follow-up: draft recovery implemented and retested

The preceding findings describe the original regression run. Later on 29 October, the user approved implementation and the draft-loss behavior was fixed. Drafts now live only in tab-local memory above the protected/login route layouts. Protected children stay mounted but hidden/inert while session checks fail; inputs and submit are disabled. A login in the same tab restores the matching account's draft and route; a different account clears it.

Validation after the fix:

- All 33 tests passed: the previous 28 plus four account-scoped draft lifecycle tests and a foreground-expiry polling test. The wedding HTTP test also verifies rejection when a form's expected account differs from the current session. Lint, type checking, formatting, build, and whitespace checks passed.
- An isolated production headless Chrome run passed actual timed session expiry while the form remained open, without focus changes or navigation. The submit button was disabled and entered values remained in the mounted form behind the session notice.
- Signing in through the provided link as the same account returned directly to the creation draft, retaining custom title, names, location, description/Unicode, and a restoration notice. Creation succeeded afterward and removed the draft/unload warning.
- Clearing the browser session cookie and attempting submission produced the expired-session flow, created no wedding, retained the draft, and allowed same-user continuation.
- Unsaved wedding edits similarly survived expiry and same-user login, returning to the matching edit route and saving successfully.
- Signing in as a different account opened its empty wedding list and a blank creation form, without the former account's draft or restoration notice.
- Both form and login notices explained tab-only retention and refresh/close discard. The unload listener cancelled a synthetic cancelable beforeunload event while dirty and stopped doing so after save. Reloading actually discarded the draft and returned a blank form. Native dialog display itself depends on browser activation/policies and is not guaranteed by this test.
- Draft contents were absent from localStorage/sessionStorage. No page exceptions were reported. All test accounts/weddings were in a temporary MongoDB replica set that was stopped after testing; this run did not access the user's configured Atlas database.

Scope: recovery requires staying in the same tab and using client-side navigation through the supplied login action. Reloading, closing, or opening a separate tab intentionally discards/does not transfer drafts. This is not durable offline draft storage or multi-device recovery. Expiry is detected on focus/visibility, at most about 30 seconds later in an active foreground tab, and immediately before saving.

## Independent acceptance regression after implementation

Retested the updated checkout on 29 October using the in-app browser and the running development server. All 33 automated tests, lint, type checking, formatting, and production build passed again.

- **Timed expiry and draft retention: passed.** Shortened only the latest active session of `qa.regression.20261029@example.com` to five seconds in the configured development database. After allowing foreground polling to run, the session-ended notice appeared. The mounted bride field still contained `Recovery Bride` and was disabled; the create button was disabled. This was a real database expiry, rather than a logout substitute. The initial hidden-browser observation did not trigger foreground polling; the test made the browser visible and allowed a polling interval.
- **Same-account continuation: passed.** Used the provided same-tab login link. Login showed the tab-only/refresh/close notice, then returned directly to `/weddings/new`. Bride/groom names, custom title, location, Unicode description, and undecided dates remained intact, the restoration notice appeared, and submission was enabled. Saving succeeded and created the QA wedding listed below.
- **Different-account clearing: passed.** Made an unsaved edit to the newly saved QA wedding, ended the session from another tab, and signed into the recovery tab as `manual.qa.20261028@example.com`. It opened that account's empty list and blank creation form. Signing back in as the original account led to the list, not the discarded edit; reopening edit showed the saved title rather than the private unsaved title.
- **Notice wording: passed.** Form, expired-session screen, and login notice explicitly explained that refreshing or closing the tab discards the draft.
- A reload attempt while dirty did not complete in this browser automation session; the draft remained, consistent with the registered unload protection. No claim is made that this acceptance run confirmed a completed refresh or the native confirmation dialog. The prior isolated-browser refresh result above remains separate evidence.

Retained additional QA wedding `QA Draft Recovery Retest`, ID `6ae3a2e3db34ab999d0d4b75`, after successfully saving the restored creation draft. No original user wedding was modified. Only the selected QA session expiry was shortened; other sessions were untouched. All test tabs ended signed out. Application code was not changed by this acceptance run.

## Test data and limits

Created and retained account `qa.regression.20261029@example.com` and one wedding, `QA Regression 2026-10-29` (ID `6ae3611edb34ab999d0d4b6d`). The wedding's dates/location are cleared; timezone is America/Toronto. Existing `manual.qa.20261028@example.com` was used as the second account. No passwords are stored in this report. Browser tabs ended signed out. No real user wedding was edited or deleted.

The browser run used the running server's database configuration without independently inspecting its target. Tests used isolated temporary MongoDB instances. Live natural expiry, live network outage/retry, every field-length boundary, every browser/platform, and all responsive routes were not exercised; earlier milestone results remain separate evidence. Deferred product modules were not tested as implemented features.
