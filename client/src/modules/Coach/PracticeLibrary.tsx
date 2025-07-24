import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Video, Download, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface CoachResource {
  id: number;
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  originalFileName?: string;
  uploadedAt: string;
}

export default function PracticeLibrary() {
  const { hasRole } = useAuth();

  // Fetch only Practice Drills resources
  const { data: practiceResources = [], isLoading } = useQuery({
    queryKey: ['/api/coach-resources', 'Practice Drills'],
    queryFn: async () => {
      const response = await fetch(`/api/coach-resources?category=Practice Drills`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: hasRole(['admin', 'manager', 'coach', 'staff'])
  });

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="h-4 w-4" />;
    if (['mp4', 'mov', 'avi'].includes(fileType)) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = Math.round(bytes / 1024);
    return kb > 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Practice Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : practiceResources.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No practice drills uploaded yet</p>
            <p className="text-sm text-gray-400">
              Upload practice drills and training materials in the Coach Resources section above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {practiceResources.slice(0, 5).map((resource: CoachResource) => (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(resource.fileType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{resource.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(resource.uploadedAt).toLocaleDateString()}
                      {resource.fileSize && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(resource.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => window.open(resource.fileUrl, '_blank')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            ))}
            
            {practiceResources.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  {practiceResources.length - 5} more practice drills available in Coach Resources above
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}