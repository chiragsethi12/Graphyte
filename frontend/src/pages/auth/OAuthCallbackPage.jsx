import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import api from "../../lib/axios";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { connectSocket } from "../../lib/socket";
import MotionPage from "../../components/layout/MotionPage";
import toast from "react-hot-toast";

export default function OAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      if (!code) {
        setError("Authorization code is missing from the callback request.");
        setLoading(false);
        return;
      }

      if (provider !== "google" && provider !== "github") {
        setError("Unsupported OAuth provider.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.post(`/auth/${provider}/callback`, { code });

        if (data.success && data.token) {
          localStorage.setItem("graphyte_token", data.token);
          setUser(data.user);
          connectSocket(data.token);
          
          setSuccess(true);
          toast.success(`Successfully authenticated with ${provider === "google" ? "Google" : "GitHub"}!`);
          
          // Redirect the user
          setTimeout(() => {
            navigate(data.user.isNewUser ? "/onboarding" : "/feed");
          }, 1000);
        } else {
          setError("Failed to obtain authentication token from server.");
        }
      } catch (err) {
        setError(err.response?.data?.message || `Failed to authenticate with ${provider}.`);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [provider, searchParams, setUser, navigate]);

  const providerName = provider === "google" ? "Google" : provider === "github" ? "GitHub" : "OAuth Provider";

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
                "Seamless sign-in with enterprise-grade identity providers ensures secure access."
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
            <div className="bg-bg-elevated rounded-2xl shadow-lg border border-border p-8 text-center animate-in fade-in zoom-in-95 duration-200">
              {loading ? (
                <div className="py-6 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                  <h2 className="text-lg font-bold text-text-primary mb-1">Authenticating...</h2>
                  <p className="text-sm text-text-muted">Exchanging authorization code with {providerName}...</p>
                </div>
              ) : success ? (
                <div className="py-2">
                  <div className="w-16 h-16 bg-semantic-success/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-semantic-success/20">
                    <CheckCircle size={32} className="text-semantic-success" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-primary mb-2">Success!</h2>
                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    Successfully verified details. Redirecting you to the platform...
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-semantic-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-semantic-destructive/20">
                    <ShieldAlert size={32} className="text-semantic-destructive" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-primary mb-2">Authentication Failed</h2>
                  <p className="text-sm text-text-muted leading-relaxed mb-6">
                    {error}
                  </p>
                  <Button onClick={() => navigate("/login")} fullWidth variant="outline">
                    Back to Sign In
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
