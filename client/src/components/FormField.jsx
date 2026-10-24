import clsx from "clsx";

export default function FormField({
  label,
  name,
  required,
  helper,
  error,
  children,
  className,
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-[14px] font-medium text-text flex items-center justify-between"
        >
          <span>{label}</span>
          {required ? (
            <span className="text-[12px] font-normal text-text-muted">(required)</span>
          ) : null}
        </label>
      )}
      {children}
      {error ? (
        <p id={name ? `${name}-error` : undefined} className="text-[13px] text-status-danger font-medium mt-0.5">
          {error}
        </p>
      ) : helper ? (
        <p id={name ? `${name}-helper` : undefined} className="text-[13px] text-text-muted mt-0.5">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
