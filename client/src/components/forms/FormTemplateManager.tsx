import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Eye, Send, Trash2, Users, Edit2 } from "lucide-react";
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
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
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

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; fields: any[] } }) => {
      const response = await apiRequest(`/api/forms/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });
      toast({
        title: "Success",
        description: "Template updated successfully"
      });
      setEditingTemplate(null);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive"
      });
    }
  });

  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || ""
    });
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    updateTemplate.mutate({
      id: editingTemplate.id,
      data: {
        name: editForm.name,
        description: editForm.description,
        fields: editingTemplate.fields
      }
    });
  };

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
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              disabled={deleteTemplate.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
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
                      </>
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

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTemplate}
                  disabled={!editForm.name.trim() || updateTemplate.isPending}
                  className="bg-[#56A0D3] hover:bg-[#4A90C2]"
                >
                  {updateTemplate.isPending ? "Updating..." : "Update Template"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}