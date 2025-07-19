import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function TokenRefreshHelper() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If user is logged in but forms are failing, suggest refreshing the token
    if (user && !token) {
      toast({
        title: "Session Issue",
        description: "Please refresh your login to access all features",
        variant: "destructive"
      });
    }
  }, [user, token, toast]);

  if (!user || !token) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Authentication Required</p>
            <p>Please log out and log back in to access the forms system.</p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="mt-2 text-blue-600 underline hover:text-blue-800"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}