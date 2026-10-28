import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Make My Marriage home">
      <span className="brand-mark" aria-hidden="true">
        M
      </span>
      <span>Make My Marriage</span>
    </Link>
  );
}
