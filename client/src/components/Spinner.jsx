import clsx from "clsx";

export default function Spinner({ size = "md", className, label = "Loading..." }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-[2px]",
    md: "w-6 h-6 border-[2.5px]",
    lg: "w-8 h-8 border-[3px]",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={clsx("inline-flex items-center justify-center", className)}
    >
      <div
        className={clsx(
          "rounded-full border-primary/20 border-t-primary animate-spin",
          sizeClasses[size] || sizeClasses.md
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
