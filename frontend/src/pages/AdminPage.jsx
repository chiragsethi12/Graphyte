import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";
import { usePageTitle } from "../hooks/usePageTitle";

export default function AdminPage() {
  usePageTitle("Admin Panel");
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-extrabold text-text-primary">Admin Control Center</h1>
          <p className="text-sm text-text-muted mt-1">
            Moderation actions and system reporting controls.
          </p>
        </div>
        <Card className="p-6 bg-bg-elevated border border-border text-center">
          <p className="text-text-primary font-semibold text-lg">System Administration Shell</p>
          <p className="text-sm text-text-muted mt-2">
            Backend enforcement is active. Frontend moderation interface is currently under construction.
          </p>
        </Card>
      </div>
    </MainLayout>
  );
}
