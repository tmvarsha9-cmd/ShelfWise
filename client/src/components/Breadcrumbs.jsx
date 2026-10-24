import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";

export default function Breadcrumbs({ items = [], className }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={clsx("mb-2", className)}>
      <ol className="flex items-center gap-1.5 text-[13px] text-text-muted">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 stroke-[1.75] opacity-50" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-text transition-colors no-underline text-text-muted"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={clsx("font-medium", isLast ? "text-text" : "text-text-muted")}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
