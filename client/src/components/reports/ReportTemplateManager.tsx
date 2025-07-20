import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Trash2, BarChart3, Settings, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReportTemplate } from "@shared/schema";

export function ReportTemplateManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/reports/templates"],
    queryFn: async () => {
      const response = await apiRequest("/api/reports/templates");
      return response.json();
    },
    enabled: !!user
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest(`/api/reports/templates/${templateId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/templates"] });
      toast({
        title: "Success",
        description: "Report template deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete report template",
        variant: "destructive"
      });
    }
  });

  const generateReport = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await apiRequest(`/api/reports/templates/${templateId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Report generated successfully"
      });
      
      // Open PDF in new tab
      if (data.outputUrls?.pdf) {
        window.open(data.outputUrls.pdf, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  });

  const getDataSourceBadgeColor = (dataSource: string) => {
    switch (dataSource) {
      case "players": return "bg-blue-100 text-blue-800";
      case "events": return "bg-green-100 text-green-800";
      case "registrations": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading report templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#56A0D3]" />
            Report Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium">No report templates found</p>
              <p className="text-sm">Create your first report template using the Report Builder</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: ReportTemplate) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge className={getDataSourceBadgeColor(template.dataSource)}>
                        {template.dataSource}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-xs text-gray-500">
                        <p>Fields: {Array.isArray(template.fields) ? template.fields.length : 0}</p>
                        <p>Formats: {Array.isArray(template.outputFormats) ? template.outputFormats.join(", ") : "PDF"}</p>
                        <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => generateReport.mutate(template.id)}
                          disabled={generateReport.isPending}
                          className="flex-1"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Generate
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Report Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTemplate.mutate(template.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}