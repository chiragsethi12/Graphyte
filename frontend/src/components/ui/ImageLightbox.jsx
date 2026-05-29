import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Full-screen image lightbox rendered via portal at document.body level.
 * Closes on backdrop click, Escape key, or the X button.
 *
 * @param {{ src: string, alt?: string, onClose: () => void }} props
 */
export default function ImageLightbox({ src, alt = "Post image", onClose }) {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        // Prevent body scroll while lightbox is open
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center animate-lightbox-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close lightbox"
            >
                <X size={20} />
            </button>

            {/* Image */}
            <img
                src={src}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-lightbox-scale-in"
            />
        </div>,
        document.body
    );
}
