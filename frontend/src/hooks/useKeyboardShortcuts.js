import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const lastKeyRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      if (e.target.matches("input, textarea, [contenteditable]")) return;

      const key = e.key.toLowerCase();

      // Cmd+K / Ctrl+K → open search overlay
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        // Dispatch custom event that NavigationRail listens to
        window.dispatchEvent(new Event("open-search"));
        return;
      }

      // G then H → go to Home/Feed
      // G then N → go to Network  
      // G then J → go to Jobs
      // G then M → go to Messaging
      if (lastKeyRef.current === "g") {
        lastKeyRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (key === "h") {
          e.preventDefault();
          navigate("/feed");
        } else if (key === "n") {
          e.preventDefault();
          navigate("/network");
        } else if (key === "j") {
          e.preventDefault();
          navigate("/jobs");
        } else if (key === "m") {
          e.preventDefault();
          navigate("/messaging");
        }
      } else if (key === "g") {
        lastKeyRef.current = "g";
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastKeyRef.current = null;
        }, 1000); // 1-second timeout window
      } else {
        lastKeyRef.current = null;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate]);
}
