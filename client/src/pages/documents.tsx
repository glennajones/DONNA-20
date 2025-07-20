import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import DocumentRepo from "@/modules/Documents/DocumentRepo";
import DocumentViewer from "@/modules/Documents/DocumentViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, Users } from "lucide-react";

export default function DocumentsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [view, setView] = useState<'repo' | 'viewer'>('repo');

  const handleViewDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setView('viewer');
  };

  const handleBackToRepo = () => {
    setSelectedDocumentId(null);
    setView('repo');
  };

  if (!user || !["admin", "manager", "coach"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access the document management system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {view === 'repo' ? 'Document Management' : 'Document Viewer'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {view === 'repo' 
                  ? 'Manage documents and electronic signatures' 
                  : 'View and sign documents'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'viewer' && (
              <Button variant="outline" onClick={handleBackToRepo} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Documents
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </div>
        </div>

        {/* Content */}
        {view === 'repo' ? (
          <DocumentRepo onViewDocument={handleViewDocument} />
        ) : (
          selectedDocumentId && (
            <DocumentViewer 
              documentId={selectedDocumentId} 
              onBack={handleBackToRepo}
            />
          )
        )}
      </div>
    </div>
  );
}