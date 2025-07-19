import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Eye, Send, Trash2, Users } from "lucide-react";
import { FormPreview } from "./FormPreview";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FormTemplate } from "@shared/schema";

interface FormTemplateManagerProps {
  onSendToPlayers?: (template: FormTemplate) => void;
}

export function FormTemplateManager({ onSendToPlayers }: FormTemplateManagerProps) {
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/forms/templates"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      console.log("Making request with token:", token ? "exists" : "missing");
      const response = await apiRequest("/api/forms/templates");
      return response.json();
    },
    enabled: !!user // Only run query if user is authenticated
  });

  // Debug logging
  if (error) {
    console.error("Templates query error:", error);
  }

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest(`/api/forms/templates/${templateId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      toast({
        title: "Success",
        description: "Form template deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete form template",
        variant: "destructive"
      });
    }
  });

  const handleDelete = (template: FormTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplate.mutate(template.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading templates. Let me try refreshing this for you.</p>
            <Button 
              onClick={() => refetch()} 
              className="mt-2"
              variant="outline"
            >
              Refresh Templates
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#56A0D3]" />
          Form Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!templates || templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No form templates created yet. Use the Form Builder to create your first template.
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template: FormTemplate) => (
              <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {onSendToPlayers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendToPlayers(template)}
                        className="text-[#56A0D3] hover:text-[#4A90C2]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(user?.role === "admin" || user?.role === "manager") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template)}
                        className="text-red-500 hover:text-red-700"
                        disabled={deleteTemplate.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex flex-wrap gap-2">
                  {template.fields.map((field: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {field.label} ({field.type})
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {previewTemplate && (
        <FormPreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          previewOnly={true}
        />
      )}
    </Card>
  );
}