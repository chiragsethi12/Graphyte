import clsx from "clsx";

export default function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div
      className={clsx(
        "bg-bg-elevated rounded-xl border border-border",
        padding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
