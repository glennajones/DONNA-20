import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

interface DashboardNavProps {
  title?: string;
  className?: string;
}

export function DashboardNav({ title, className = "" }: DashboardNavProps) {
  const [, setLocation] = useLocation();

  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLocation("/dashboard")}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Button>
      {title && (
        <>
          <ArrowLeft className="h-4 w-4 text-gray-400" />
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {title}
          </span>
        </>
      )}
    </div>
  );
}