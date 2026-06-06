import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-muted">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full rounded-md border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder-text-faint",
            "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent",
            "transition-colors duration-150 min-h-[44px]",
            Icon && "pl-9",
            error
              ? "border-semantic-destructive focus:ring-semantic-destructive"
              : "border-border hover:border-text-faint",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-semantic-destructive">{error}</p>}
    </div>
  );
});

export default Input;
