import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-extrabold text-primary animate-pulse">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h2>
        <p className="text-gray-600 mt-2">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-950 transition-colors shadow-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
