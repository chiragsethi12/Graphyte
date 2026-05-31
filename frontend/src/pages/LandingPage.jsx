import { Link } from "react-router-dom";
import { Share2, Users, Briefcase, ChevronRight } from "lucide-react";
import heroImg from "../assets/hero.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-surface-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-extrabold text-2xl text-primary tracking-tight">
              Graphyte
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-950 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-tight">
                Connect. <span className="text-primary">Discover.</span> Grow.
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 font-medium">
                The professional networking platform built for ambitious people.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto bg-primary text-white text-base font-bold px-8 py-4 rounded-xl hover:bg-primary-950 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/20 text-center flex items-center justify-center gap-2 group"
                >
                  Get Started
                  <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 text-base font-bold px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-305 transition-all text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-none">
                <div className="absolute -inset-4 bg-primary/5 rounded-3xl transform rotate-2 blur-lg" />
                <img
                  src={heroImg}
                  alt="Graphyte Professional Networking"
                  className="relative z-10 w-full h-auto max-h-[400px] object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary text-white py-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">10,000+</p>
              <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Professionals</p>
            </div>
            <div className="space-y-1 pt-6 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">5,000+</p>
              <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Connections Made</p>
            </div>
            <div className="space-y-1 pt-6 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">1,200+</p>
              <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Jobs Listed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Designed for the Modern Professional
            </h2>
            <p className="text-lg text-gray-500">
              Everything you need to showcase your skills, build connections, and accelerate your career.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feed Card */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Share2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Share your journey</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Post updates, share articles, showcase achievements, and engage with professional posts in your feed.
              </p>
            </div>

            {/* Network Card */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Build your circle</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connect with like-minded professionals, request recommendations, and collaborate using real-time direct messaging.
              </p>
            </div>

            {/* Jobs Card */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Briefcase size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Find opportunities</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Explore job listings tailored to your skills, post role openings, and build professional value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to take the next step?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            Join the community of developers, creators, and leaders shaping the future of work.
          </p>
          <div>
            <Link
              to="/register"
              className="inline-block bg-primary text-white text-base font-bold px-10 py-5 rounded-xl hover:bg-primary-950 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/20"
            >
              Join Graphyte Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8 border-t border-slate-900 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Graphyte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
