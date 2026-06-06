import { useState } from "react";

/**
 * Inline confirmation wrapper for destructive actions.
 *
 * Usage:
 *   <ConfirmAction
 *     onConfirm={() => deleteMutation.mutate()}
 *     message="Delete this post?"
 *     confirmLabel="Delete"
 *     variant="danger"
 *   >
 *     {(requestConfirm) => (
 *       <button onClick={requestConfirm}>
 *         <Trash2 size={15} /> Delete
 *       </button>
 *     )}
 *   </ConfirmAction>
 */
export default function ConfirmAction({
  onConfirm,
  message = "Are you sure?",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "warning"
  children,
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    setConfirming(false);
    onConfirm();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
        <span className="text-xs text-text-muted font-medium whitespace-nowrap">{message}</span>
        <button
          onClick={handleConfirm}
          className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
            variant === "danger"
              ? "bg-semantic-destructive text-white hover:bg-red-600"
              : "bg-semantic-warning text-white hover:bg-amber-600"
          }`}
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-medium text-text-muted hover:text-text-primary px-2 py-1 rounded-md hover:bg-bg-hover transition-colors whitespace-nowrap"
        >
          {cancelLabel}
        </button>
      </div>
    );
  }

  return children(() => setConfirming(true));
}
