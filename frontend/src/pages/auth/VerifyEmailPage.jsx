import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShieldAlert, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import api from "../../lib/axios";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import MotionPage from "../../components/layout/MotionPage";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const performVerification = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setSuccess(true);
        if (user) {
          setUser((prev) => ({ ...prev, isVerified: true }));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Verification failed. The link may be invalid or expired.");
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      performVerification();
    }
  }, [token, user, setUser]);

  return (
    <MotionPage>
      <div className="min-h-screen flex bg-bg-base">
        {/* Left — Brand panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-muted via-bg-base to-bg-elevated border-r border-border flex-col justify-between p-12 text-text-primary">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="Graphyte Logo" className="w-9 h-9 object-contain rounded-lg" />
              <h1 className="text-2xl font-cinzel font-extrabold tracking-widest text-accent mt-0.5">GRAPHYTE</h1>
            </div>
            <p className="text-text-muted text-sm">Professional Networking Platform</p>
          </div>
          <div>
            <blockquote className="border-l-4 border-accent pl-4 mb-8">
              <p className="text-lg font-medium text-text-primary/90 leading-relaxed">
                "Verified profiles establish trust and credibility in professional connections."
              </p>
            </blockquote>
          </div>
          <p className="text-text-faint text-xs">© 2026 Graphyte Professional. All rights reserved.</p>
        </div>

        {/* Right — Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden mb-8 flex items-center gap-2.5">
              <img src="/logo.png" alt="Graphyte Logo" className="w-7 h-7 object-contain rounded-lg" />
              <h1 className="text-xl font-cinzel font-extrabold tracking-widest text-accent mt-0.5">GRAPHYTE</h1>
            </div>
            <div className="bg-bg-elevated rounded-2xl shadow-lg border border-border p-8 text-center">
              {loading ? (
                <div className="py-6 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                  <h2 className="text-lg font-bold text-text-primary mb-1">Verifying Email...</h2>
                  <p className="text-sm text-text-muted">Enforcing server-side credential verification.</p>
                </div>
              ) : success ? (
                <div>
                  <div className="w-16 h-16 bg-semantic-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-semantic-success/20">
                    <CheckCircle size={32} className="text-semantic-success" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-primary mb-2">Email Verified!</h2>
                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    Thank you. Your email address has been successfully verified. You now have full access to all features.
                  </p>
                  <Button onClick={() => navigate(user ? "/feed" : "/login")} fullWidth className="inline-flex items-center justify-center gap-2">
                    {user ? "Go to Feed" : "Sign In"} <ArrowRight size={16} />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-semantic-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-semantic-destructive/20">
                    <ShieldAlert size={32} className="text-semantic-destructive" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-primary mb-2">Verification Failed</h2>
                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    {error}
                  </p>
                  <Button onClick={() => navigate(user ? "/feed" : "/login")} fullWidth variant="outline">
                    {user ? "Go to Feed" : "Back to Sign In"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MotionPage>
  );
}
