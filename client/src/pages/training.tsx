import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Construction, Calendar, Users, Clock } from "lucide-react";

export default function TrainingPage() {
  return (
    <ProtectedRoute requiredRoles={["admin", "manager", "coach"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">Training Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage training sessions, schedules, and attendance.
            </p>
          </div>

          <div className="px-4 sm:px-0">
            <Alert className="mb-6">
              <Construction className="h-4 w-4" />
              <AlertDescription>
                <strong>Module in Development</strong>
                <br />
                The Training Management module is currently being developed. This will include training session scheduling, attendance tracking, and coach assignment features.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                    Session Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Schedule training sessions, set recurring sessions, and manage court bookings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-500" />
                    Attendance Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Track player attendance, manage absences, and generate attendance reports.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Session Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Create training plans, drills library, and progress tracking for players.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}