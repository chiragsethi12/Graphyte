import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, User, Eye, EyeOff, AtSign, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import MotionPage from "../../components/layout/MotionPage";

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const [usernameStatus, setUsernameStatus] = useState("idle"); // "idle" | "checking" | "available" | "taken" | "invalid"
  const [checkedUsername, setCheckedUsername] = useState("");
  const debounceRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: "", username: "", email: "", password: "", confirm: "" } });

  const watchedUsername = watch("username");
  const watchedPassword = watch("password");

  // Debounced username availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const val = watchedUsername;
    if (!val || val.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");

      let isInvalid = false;
      if (clean !== val.toLowerCase()) {
        setUsernameStatus("invalid");
        isInvalid = true;
      } else {
        setUsernameStatus("checking");
      }

      if (!clean) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/check-username?username=${clean}`);
        const data = await res.json();

        if (data.available) {
          if (!isInvalid) setUsernameStatus("available");
          setCheckedUsername(clean);
        } else {
          setUsernameStatus("taken");
          setCheckedUsername(clean);
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [watchedUsername]);

  const onSubmit = async (values) => {
    setServerError("");

    if (usernameStatus === "checking") {
      setServerError("Please wait for username check to complete");
      return;
    }

    if (usernameStatus === "taken") {
      setServerError("Username is already taken");
      return;
    }

    if (usernameStatus === "invalid") {
      setServerError("Please fix your username format");
      return;
    }

    try {
      await authRegister(values.name, values.email, values.password, values.username);
      toast.success("Welcome to Graphyte!");
      navigate("/feed");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google signup is not configured. Please define VITE_GOOGLE_CLIENT_ID in your environment.");
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const defaultRedirect = apiBase.replace("/api", "") + "/auth/google/callback";
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || defaultRedirect;
    const scope = "openid email profile";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}&prompt=select_account`;
    window.location.href = url;
  };

  const handleGithubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      toast.error("GitHub signup is not configured. Please define VITE_GITHUB_CLIENT_ID in your environment.");
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const defaultRedirect = apiBase.replace("/api", "") + "/auth/github/callback";
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || defaultRedirect;
    const scope = "user:email";
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}`;
    window.location.href = url;
  };

  return (
    <MotionPage>
      <div className="min-h-screen flex">
      {/* Left — Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-muted via-bg-base to-bg-elevated border-r border-border flex-col justify-between p-12 text-text-primary">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="Graphyte Logo" className="w-9 h-9 object-contain rounded-lg animate-in fade-in" />
            <h1 className="text-2xl font-cinzel font-extrabold tracking-widest text-accent mt-0.5">GRAPHYTE</h1>
          </div>
          <p className="text-text-muted text-sm">Professional Networking Platform</p>
        </div>
        <div className="space-y-4">
          {[
            ["🌍", "Elite Global Network", "Connect with top-tier professionals across 180+ countries"],
            ["💼", "Curated Opportunities", "Access C-suite and executive roles invisible elsewhere"],
            ["📊", "Actionable Insights", "Data-driven analytics to supercharge your career"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-4 bg-bg-elevated/40 border border-border/60 rounded-xl p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-text-primary">{title}</p>
                <p className="text-text-muted text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-text-faint text-xs">© 2026 Graphyte Professional. All rights reserved.</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg-base">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <img src="/logo.png" alt="Graphyte Logo" className="w-7 h-7 object-contain rounded-lg" />
            <h1 className="text-xl font-cinzel font-extrabold tracking-widest text-accent mt-0.5">GRAPHYTE</h1>
          </div>
          <div className="bg-bg-elevated rounded-2xl shadow-lg border border-border p-8">
            <h2 className="text-2xl font-display font-bold text-text-primary mb-1">Create your account</h2>
            <p className="text-sm text-text-muted mb-6">Join the world's most exclusive professional network</p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {serverError && (
                <div className="bg-semantic-destructive/10 border border-semantic-destructive/30 rounded-lg px-4 py-3 text-sm text-semantic-destructive">{serverError}</div>
              )}

              <Input
                label="Full Name"
                type="text"
                placeholder="Elena Sterling"
                icon={User}
                error={errors.name?.message}
                {...register("name", {
                  required: "Full name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
              />

              <div className="relative flex flex-col gap-1">
                <label className="text-sm font-medium text-text-muted">Username</label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                  <input
                    type="text"
                    placeholder="your-username"
                    className={`w-full pl-9 pr-24 py-2.5 text-sm rounded-md bg-bg-elevated border text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all duration-150 min-h-[44px] ${
                      usernameStatus === "available"
                        ? "border-semantic-success focus:ring-semantic-success focus:border-semantic-success"
                        : usernameStatus === "taken"
                        ? "border-semantic-destructive focus:ring-semantic-destructive focus:border-semantic-destructive"
                        : errors.username
                        ? "border-semantic-destructive focus:ring-semantic-destructive focus:border-semantic-destructive"
                        : "border-border hover:border-text-faint"
                    }`}
                    {...register("username", {
                      required: "Username is required",
                      minLength: { value: 3, message: "Username must be at least 3 characters" },
                      maxLength: { value: 30, message: "Username must be under 30 characters" },
                      pattern: { value: /^[a-z0-9_-]+$/i, message: "Only letters, numbers, - and _ allowed" },
                    })}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-bg-elevated pl-1">
                    {usernameStatus === "checking" && <Loader2 size={14} className="text-text-faint animate-spin" />}
                    {usernameStatus === "available" && (
                      <>
                        <CheckCircle2 size={14} className="text-semantic-success" />
                        <span className="text-xs text-semantic-success font-medium">Available</span>
                      </>
                    )}
                    {usernameStatus === "taken" && (
                      <>
                        <XCircle size={14} className="text-semantic-destructive" />
                        <span className="text-xs text-semantic-destructive font-medium">Taken</span>
                      </>
                    )}
                  </div>
                </div>
                {errors.username && <p className="text-semantic-destructive text-xs mt-1">{errors.username.message}</p>}
                {usernameStatus === "available" && <p className="text-xs text-semantic-success mt-0.5">✓ @{checkedUsername} is available</p>}
                {usernameStatus === "taken" && <p className="text-xs text-semantic-destructive mt-0.5">✗ @{checkedUsername} is already taken</p>}
                {usernameStatus === "invalid" && <p className="text-xs text-text-muted mt-0.5">Only letters, numbers, - and _ allowed</p>}
              </div>

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

              <div className="relative flex flex-col gap-1">
                <label className="text-sm font-medium text-text-muted">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-md bg-bg-elevated border text-text-primary placeholder-text-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors duration-150 min-h-[44px] ${errors.password ? "border-semantic-destructive focus:ring-semantic-destructive" : "border-border hover:border-text-faint"}`}
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" },
                    })}
                  />
                  <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted min-h-[44px] px-1 flex items-center justify-center">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-semantic-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                icon={Lock}
                error={errors.confirm?.message}
                {...register("confirm", {
                  required: "Please confirm your password",
                  validate: (value) => value === watchedPassword || "Passwords do not match",
                })}
              />

              <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
                {isSubmitting ? "Creating account…" : "Create Account"}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-elevated px-2 text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-bg-elevated border border-border hover:bg-bg-elevated-hover hover:border-text-faint transition-all duration-150 min-h-[44px] text-text-primary"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-bg-elevated border border-border hover:bg-bg-elevated-hover hover:border-text-faint transition-all duration-150 min-h-[44px] text-text-primary"
              >
                <svg className="w-4 h-4 fill-current text-text-primary" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                GitHub
              </button>
            </div>

            <p className="text-center text-sm text-text-muted mt-6">
              Already on Graphyte?{" "}
              <Link to="/login" className="text-accent font-semibold hover:text-accent-hover hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </MotionPage>
);
}
