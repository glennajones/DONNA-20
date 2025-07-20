import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import MyDashboard from "@/modules/PlayerZone/MyDashboard";

export default function PlayerDashboardPage() {
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

  // For now, allow all authenticated users to access player dashboard
  // In a real system, you'd check if the user has player role or is associated with a player

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MyDashboard />
    </div>
  );
}