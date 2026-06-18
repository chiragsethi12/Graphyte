import NavigationRail from "./NavigationRail";
import MobileBottomNav from "./MobileBottomNav";
import MotionPage from "./MotionPage";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { ShieldAlert } from "lucide-react";

export default function MainLayout({ children }) {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification link sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification link");
    } finally {
      setResending(false);
    }
  };

  const showBanner = user && !user.isVerified;

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <NavigationRail />
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 lg:pb-0">
        <div className="w-full px-4 py-6">
          {showBanner && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#1F0D15]/90 border border-[#5A122E]/80 rounded-xl mb-6 backdrop-blur-md text-xs sm:text-sm text-white shadow-lg shadow-[#FF4D6D]/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FF4D6D]/10 text-[#FF4D6D] flex-shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="font-semibold text-left">Verify your email address</p>
                  <p className="text-xs text-text-muted mt-0.5 text-left">Please check your inbox for the verification link to unlock job postings and connection requests.</p>
                </div>
              </div>
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50 flex-shrink-0 min-h-[36px]"
              >
                {resending ? "Sending..." : "Resend Link"}
              </button>
            </div>
          )}
          <MotionPage>
            {children}
          </MotionPage>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
