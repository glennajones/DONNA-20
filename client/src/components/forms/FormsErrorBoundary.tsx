import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface FormsErrorBoundaryProps {
  error?: Error;
  retry?: () => void;
}

export function FormsErrorBoundary({ error, retry }: FormsErrorBoundaryProps) {
  const { logout } = useAuth();

  const handleRefreshSession = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-red-600">
          Authentication Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Your session may have expired. Please log in again to access the forms system.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2 justify-center">
          {retry && (
            <Button
              variant="outline"
              onClick={retry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          <Button
            onClick={handleRefreshSession}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Login Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}