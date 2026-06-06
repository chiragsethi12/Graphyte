import clsx from "clsx";

const variants = {
  skill:   "bg-accent-muted text-accent border border-border-accent",
  gray:    "bg-bg-hover text-text-muted border border-border",
  green:   "bg-[rgba(16,185,129,0.1)] text-semantic-success border border-[rgba(16,185,129,0.2)]",
  premium: "bg-[rgba(245,158,11,0.1)] text-semantic-warning border border-[rgba(245,158,11,0.2)]",
};

export default function Badge({ children, variant = "gray", className = "" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
