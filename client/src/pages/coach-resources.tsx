import React from "react";
import Navbar from "@/components/layout/Navbar";
import TimeClock from "@/modules/Coach/TimeClock";
import PracticeLibrary from "@/modules/Coach/PracticeLibrary";
import GameTools from "@/modules/Coach/GameTools";
import AdminApprovals from "@/modules/Coach/AdminApprovals";
import CoachResourcesUpload from "@/modules/Coach/CoachResourcesUpload";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

export default function CoachResourcesPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Coach Resources
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Essential tools for coaching and team management
              </p>
            </div>
          </div>
        </div>

        {/* Time Clock Section */}
        <div className="mb-8">
          <TimeClock />
        </div>

        {/* Admin Approvals Section - Only show for admins */}
        {user?.role === "admin" && (
          <div className="mb-8">
            <AdminApprovals />
          </div>
        )}

        {/* Practice Library Section */}
        <div className="mb-8">
          <PracticeLibrary />
        </div>

        {/* Coach Resources Upload Section */}
        <div className="mb-8">
          <CoachResourcesUpload />
        </div>

        {/* Game Tools Section */}
        <div className="mb-8">
          <GameTools />
        </div>
      </div>
    </div>
  );
}