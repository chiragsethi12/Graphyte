import { motion } from "framer-motion";
import clsx from "clsx";

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  outline: "border border-border text-text-primary hover:bg-bg-hover",
  ghost:   "text-text-muted hover:bg-bg-hover hover:text-text-primary",
  danger:  "bg-semantic-destructive text-white hover:bg-red-600",
  white:   "bg-bg-hover text-text-primary border border-border hover:bg-bg-active",
};

const sizes = {
  sm:  "text-xs px-3 py-1.5 min-h-[36px]",
  md:  "text-sm px-4 py-2.5 min-h-[44px]",
  lg:  "text-base px-6 py-3 min-h-[48px]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  return (
    <motion.button
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-md",
        "transition-colors duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
