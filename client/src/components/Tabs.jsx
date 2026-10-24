import clsx from "clsx";

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className,
}) {
  return (
    <div
      role="tablist"
      className={clsx(
        "flex items-center gap-1 border-b border-border text-[14px] overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "px-4 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text hover:border-border"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "px-1.5 py-0.2 text-[12px] rounded-full tabular-nums",
                  isActive ? "bg-primary-subtle text-primary font-semibold" : "bg-surface-muted text-text-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
