import clsx from "clsx";

export default function FilterBar({ children, className }) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-border rounded-card mb-4",
        className
      )}
    >
      {children}
    </div>
  );
}
