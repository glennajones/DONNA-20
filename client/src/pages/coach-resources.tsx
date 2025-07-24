import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import TimeClock from "@/modules/Coach/TimeClock";
import PracticeLibrary from "@/modules/Coach/PracticeLibrary";
import GameTools from "@/modules/Coach/GameTools";
import AdminApprovals from "@/modules/Coach/AdminApprovals";
import CoachResourcesUpload from "@/modules/Coach/CoachResourcesUpload";
import FolderManager from "@/modules/Coach/FolderManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Home } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

export default function CoachResourcesPage() {
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string>("");

  const handleFolderSelect = (folderId: number | null, folderName?: string) => {
    setCurrentFolderId(folderId);
    setCurrentFolderName(folderName || "");
  };

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

        {/* Breadcrumb Navigation */}
        {currentFolderId && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <Button
              variant="ghost"
              size="sm" 
              onClick={() => handleFolderSelect(null)}
              className="h-8"
            >
              <Home className="h-4 w-4 mr-2" />
              Root
            </Button>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium">{currentFolderName}</span>
          </div>
        )}

        {/* Folder Management Section */}
        <div className="mb-8">
          <FolderManager 
            currentFolderId={currentFolderId || undefined}
            onFolderSelect={handleFolderSelect}
          />
        </div>

        {/* Coach Resources Upload Section */}
        <div className="mb-8">
          <CoachResourcesUpload 
            currentFolderId={currentFolderId || undefined}
            currentFolderName={currentFolderName}
          />
        </div>

        {/* Practice Library Section */}
        <div className="mb-8">
          <PracticeLibrary />
        </div>

        {/* Game Tools Section */}
        <div className="mb-8">
          <GameTools />
        </div>
      </div>
    </div>
  );
}