import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import RegistrationsList from "@/components/registration/RegistrationsList";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import { UserPlus } from "lucide-react";

export default function RegistrationsManagementPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "manager"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <DashboardNav title="Registration Management" />
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Registration Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Review and manage volleyball club registration applications.
                </p>
              </div>
              
              <Link href="/registration">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Registration
                </Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-0">
            <RegistrationsList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}