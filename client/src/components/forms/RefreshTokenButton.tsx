import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function RefreshTokenButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleRefreshAuth = async () => {
    setIsRefreshing(true);
    try {
      // Clear existing auth and redirect to login
      logout();
      toast({
        title: "Session Refreshed",
        description: "Please log in again to continue"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh session",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefreshAuth}
      disabled={isRefreshing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Session"}
    </Button>
  );
}