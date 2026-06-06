import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../lib/axios";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      setSentEmail(values.email);
      setSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-muted via-bg-base to-bg-elevated border-r border-border flex-col justify-between p-12 text-text-primary">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight mb-2 text-accent">Graphyte</h1>
          <p className="text-text-muted text-sm">Professional Networking Platform</p>
        </div>
        <div>
          <blockquote className="border-l-4 border-accent pl-4 mb-8">
            <p className="text-lg font-medium text-text-primary/90 leading-relaxed">
              "Security isn't just a feature — it's the foundation of trust in every professional relationship."
            </p>
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[["256-bit", "Encryption"], ["24/7", "Security Team"], ["99.9%", "Uptime"], ["GDPR", "Compliant"]].map(([val, label]) => (
              <div key={label} className="bg-bg-elevated/40 border border-border/60 rounded-xl p-4">
                <p className="text-2xl font-bold text-text-primary">{val}</p>
                <p className="text-text-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-text-faint text-xs">© 2026 Graphyte Professional. All rights reserved.</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg-base">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-display font-extrabold text-accent">Graphyte</h1>
          </div>
          <div className="bg-bg-elevated rounded-2xl shadow-lg border border-border p-8">
            {sent ? (
              /* ─── Success State ─── */
              <div className="text-center">
                <div className="w-16 h-16 bg-semantic-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-semantic-success" />
                </div>
                <h2 className="text-xl font-display font-bold text-text-primary mb-2">Check your email</h2>
                <p className="text-sm text-text-muted leading-relaxed mb-6">
                  If an account exists for <strong className="text-text-primary">{sentEmail}</strong>, we've sent a password reset link. Check your inbox and spam folder.
                </p>
                <p className="text-xs text-text-faint mb-6">The link expires in 1 hour.</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-accent font-semibold hover:text-accent-hover hover:underline"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            ) : (
              /* ─── Form State ─── */
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-5 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
                <h2 className="text-2xl font-display font-bold text-text-primary mb-1">Forgot password?</h2>
                <p className="text-sm text-text-muted mb-6">
                  Enter the email associated with your account and we'll send a reset link.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                  {serverError && (
                    <div className="bg-semantic-destructive/10 border border-semantic-destructive/30 rounded-lg px-4 py-3 text-sm text-semantic-destructive">
                      {serverError}
                    </div>
                  )}
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    error={errors.email?.message}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                  />
                  <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
                    {isSubmitting ? "Sending…" : "Send Reset Link"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
