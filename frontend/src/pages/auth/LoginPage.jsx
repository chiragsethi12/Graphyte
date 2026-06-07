import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import MotionPage from "../../components/layout/MotionPage";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      navigate("/feed");
    } catch (err) {
      setServerError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <MotionPage>
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
              "True value isn't found in the number of connections you have, but in the deliberate silence between meaningful interactions."
            </p>
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[["1M+", "Elite Professionals"], ["180+", "Countries"], ["50K+", "Opportunities"], ["4.9★", "App Rating"]].map(([val, label]) => (
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
            <h2 className="text-2xl font-display font-bold text-text-primary mb-1">Welcome back</h2>
            <p className="text-sm text-text-muted mb-6">Sign in to your Graphyte account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {serverError && (
                <div className="bg-semantic-destructive/10 border border-semantic-destructive/30 rounded-lg px-4 py-3 text-sm text-semantic-destructive">
                  {serverError}
                </div>
              )}
              <Input
                label="Email"
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
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-muted">Password</label>
                  <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-hover hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-md bg-bg-elevated border text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors duration-150 min-h-[44px] ${errors.password ? "border-semantic-destructive focus:ring-semantic-destructive" : "border-border hover:border-text-faint"}`}
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted min-h-[44px] px-1 flex items-center justify-center"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-semantic-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>
              <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
                {isSubmitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-accent font-semibold hover:text-accent-hover hover:underline">
                Join Graphyte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </MotionPage>
);
}
