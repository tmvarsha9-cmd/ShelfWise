import clsx from "clsx";

export default function KeyValueList({ items, className }) {
  if (!items || items.length === 0) return null;

  return (
    <dl className={clsx("divide-y divide-border text-[14px]", className)}>
      {items.map((item, idx) => (
        <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-text-muted font-normal shrink-0">{item.label}</dt>
          <dd className="text-text font-medium text-right tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
