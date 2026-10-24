import Breadcrumbs from "./Breadcrumbs";
import clsx from "clsx";

export default function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  className,
}) {
  return (
    <div className={clsx("mb-6", className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold text-text tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[14px] text-text-muted mt-1 leading-normal max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-3">{action}</div>}
      </div>
    </div>
  );
}
