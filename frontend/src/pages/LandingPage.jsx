import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Share2, Users, Briefcase, ChevronRight, MessageSquare, Award } from "lucide-react";
import MotionPage from "../components/layout/MotionPage";

export default function LandingPage() {
  const { user } = useAuth();

  // If user is already logged in, redirect them to their feed or onboarding
  if (user) {
    return <Navigate to={user.isNewUser ? "/onboarding" : "/feed"} replace />;
  }

  // Generate fake profile card data for the visual background grid
  const MOCK_PROFILES = [
    { name: "Sarah Lin", role: "Frontend Architect", skills: "React, WebGL", color: "from-pink-500 to-rose-500", top: "15%", left: "8%" },
    { name: "David K.", role: "Distributed Systems", skills: "Go, Kubernetes", color: "from-blue-500 to-cyan-500", top: "22%", right: "12%" },
    { name: "Elena Rostova", role: "Product Designer", skills: "Figma, Design Systems", color: "from-purple-500 to-indigo-500", top: "58%", left: "5%" },
    { name: "Marcus Chen", role: "AI Engineer", skills: "Python, PyTorch", color: "from-amber-500 to-orange-500", top: "68%", right: "10%" },
    { name: "Amina J.", role: "Fullstack Dev", skills: "Node.js, Postgres", color: "from-emerald-500 to-teal-500", top: "45%", left: "42%" },
  ];

  return (
    <MotionPage>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col font-sans text-text-primary overflow-hidden relative selection:bg-accent selection:text-white">
        {/* Abstract dark elements background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#99004C]/5 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#99004C]/5 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4" />

        {/* Navigation Header */}
        <header className="bg-[#0A0A0A]/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Graphyte Logo" className="w-8 h-8 object-contain rounded-lg animate-in fade-in" />
              <span className="font-extrabold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#FF4D6D] font-cinzel">
                GRAPHYTE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-glow-accent min-h-[40px] flex items-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] py-20">
          {/* Visual: grid of fake profile cards with avatars, slightly blurred, as background */}
          <div className="absolute inset-0 pointer-events-none hidden md:block select-none overflow-hidden">
            {MOCK_PROFILES.map((profile, index) => (
              <div
                key={index}
                className="absolute bg-[#111118]/60 border border-border/30 rounded-xl p-4 shadow-2xl backdrop-blur-md w-56 transform transition-all duration-1000 opacity-25 hover:opacity-50 blur-[1px] hover:blur-0 scale-95 hover:scale-100"
                style={{
                  top: profile.top,
                  left: profile.left,
                  right: profile.right,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${profile.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {profile.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{profile.name}</p>
                    <p className="text-[10px] text-text-muted truncate">{profile.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {profile.skills.split(",").map((s, i) => (
                    <span key={i} className="text-[8px] bg-bg-hover text-text-muted border border-border/20 px-1.5 py-0.5 rounded">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center z-10 space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A000A] text-[#FF4D6D] border border-accent/20 rounded-full text-xs font-bold tracking-wide uppercase">
              Now Live for Builders & Creators
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight font-display">
              Connect. <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#FF4D6D]">Build.</span> Grow.
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto font-medium leading-relaxed">
              The professional network for builders and creators.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto bg-accent text-white text-base font-bold px-8 py-4 rounded-xl hover:bg-accent-hover transition-all transform hover:-translate-y-0.5 shadow-glow-accent text-center flex items-center justify-center gap-2 group min-h-[52px]"
              >
                Get Started
                <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto bg-transparent border border-border text-white text-base font-bold px-8 py-4 rounded-xl hover:bg-bg-hover hover:border-border-muted transition-all text-center min-h-[52px] flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES (3-column) */}
        <section className="py-24 border-t border-border/40 bg-[#0A0A0A] relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                Next-Gen Professional Networking
              </h2>
              <p className="text-base text-text-muted">
                Crafted specifically for ambitious builders, developers, and creators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-[#111118] rounded-2xl p-8 border border-border/40 hover:border-accent/40 hover:shadow-glow-accent hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Smart Networking</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Connect based on mutual friends and shared skills. Find target-rich engineering collaboration opportunities.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#111118] rounded-2xl p-8 border border-border/40 hover:border-accent/40 hover:shadow-glow-accent hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Real-time Messaging</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Encrypted conversations equipped with real-time presence indicators, typing feedback, and instant quick replies.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#111118] rounded-2xl p-8 border border-border/40 hover:border-accent/40 hover:shadow-glow-accent hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/20">
                  <Award size={24} />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Career Growth</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Share milestone posts, earn peer skill endorsements, and track analytics on profile visibility.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="bg-[#111118] border-y border-border/40 text-text-primary py-12 shadow-inner relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#FF4D6D]">Built by engineers, for engineers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-border/30">
              <div className="space-y-1">
                <p className="text-4xl font-extrabold tracking-tight text-white font-display">10,000+</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Professionals</p>
              </div>
              <div className="space-y-1 pt-6 md:pt-0">
                <p className="text-4xl font-extrabold tracking-tight text-white font-display">50,000+</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Connections</p>
              </div>
              <div className="space-y-1 pt-6 md:pt-0">
                <p className="text-4xl font-extrabold tracking-tight text-white font-display">5,000+</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Jobs</p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bg-[#0A0A0A] text-text-primary py-24 border-t border-border/40 relative overflow-hidden z-10">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-display">
              Join the Future of Professional Networks
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto font-medium">
              Join the community of developers, creators, and leaders shaping the future of work.
            </p>
            <div>
              <Link
                to="/register"
                className="inline-block bg-accent text-white text-base font-bold px-10 py-5 rounded-xl hover:bg-accent-hover transition-all transform hover:-translate-y-0.5 shadow-glow-accent min-h-[52px]"
              >
                Join Graphyte Today
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0A0A0A] text-text-faint py-8 border-t border-border/20 text-center text-xs relative z-10">
          <div className="max-w-7xl mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} Graphyte. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </MotionPage>
  );
}
