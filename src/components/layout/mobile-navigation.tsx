"use client";

import { useRef } from "react";

export function MobileNavigation({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  return (
    <details
      className="mobile-menu"
      ref={menuRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuRef.current) {
          menuRef.current.open = false;
          menuRef.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Toggle navigation">
        <span aria-hidden="true">☰</span>
      </summary>
      <nav aria-label="Mobile navigation">
        {items.map(([label, href]) => (
          <a
            key={href}
            href={href}
            onClick={() => {
              if (menuRef.current) menuRef.current.open = false;
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </details>
  );
}
