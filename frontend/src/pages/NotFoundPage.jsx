import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-extrabold text-accent font-display animate-pulse">404</h1>
        <h2 className="text-2xl font-bold font-display text-text-primary mt-4">Page not found</h2>
        <p className="text-text-muted mt-2">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md min-h-[44px]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
