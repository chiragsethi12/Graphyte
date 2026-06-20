import React from "react";
import { Sentry } from "../../lib/sentry.js";

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    if (Sentry) {
      Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-gray-500">
          <p className="text-xl font-semibold">Something went wrong</p>
          <button onClick={() => { this.setState({hasError:false}); window.location.href='/feed'; }}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
            Back to Feed
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

