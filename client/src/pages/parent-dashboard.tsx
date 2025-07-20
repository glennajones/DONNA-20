import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import ChildDashboard from "@/modules/ParentZone/ChildDashboard";

export default function ParentDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // For now, allow all authenticated users to access parent dashboard
  // In a real system, you'd check if the user has parent role or is associated with a parent

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ChildDashboard />
    </div>
  );
}