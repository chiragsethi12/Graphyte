import NavigationRail from "./NavigationRail";
import MobileBottomNav from "./MobileBottomNav";
import MotionPage from "./MotionPage";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <NavigationRail />
      <main className="flex-1 min-w-0 overflow-y-auto pb-16 lg:pb-0">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <MotionPage>
            {children}
          </MotionPage>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
