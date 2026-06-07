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
