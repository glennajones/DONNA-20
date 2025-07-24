import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderPlus, Edit, Trash2, ChevronRight, FolderOpen } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  'General',
  'Practice Drills',
  'Policies', 
  'Game Plans',
  'Training Videos',
  'Certifications',
  'Forms',
  'Team Building',
  'Strategy',
  'Equipment'
];

interface CoachResourceFolder {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  category: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface FolderManagerProps {
  currentFolderId?: number;
  onFolderSelect: (folderId: number | null, folderName?: string) => void;
}

export default function FolderManager({ currentFolderId, onFolderSelect }: FolderManagerProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CoachResourceFolder | null>(null);
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    category: 'General',
    parentId: currentFolderId || null
  });

  // Fetch folders
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['/api/coach-resource-folders', currentFolderId],
    queryFn: async () => {
      const response = await fetch(`/api/coach-resource-folders?parentId=${currentFolderId || ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: typeof newFolder) => {
      const response = await apiRequest('POST', '/api/coach-resource-folders', folderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach-resource-folders'] });
      setIsCreateDialogOpen(false);
      setNewFolder({ name: '', description: '', category: 'General', parentId: currentFolderId || null });
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    }
  });

  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<CoachResourceFolder>) => {
      const response = await apiRequest('PUT', `/api/coach-resource-folders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach-resource-folders'] });
      setEditingFolder(null);
      toast({
        title: "Success",
        description: "Folder updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update folder",
        variant: "destructive",
      });
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      const response = await apiRequest('DELETE', `/api/coach-resource-folders/${folderId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coach-resource-folders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach-resources'] });
      toast({
        title: "Success",
        description: "Folder and all contents deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      });
    }
  });

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }
    createFolderMutation.mutate(newFolder);
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !editingFolder.name.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }
    updateFolderMutation.mutate(editingFolder);
  };

  const handleDeleteFolder = (folderId: number) => {
    deleteFolderMutation.mutate(folderId);
  };

  if (!hasRole(['admin', 'manager', 'coach', 'staff'])) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Resource Folders
            {currentFolderId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFolderSelect(null)}
                className="text-sm text-gray-500"
              >
                (Back to Root)
              </Button>
            )}
          </CardTitle>
          
          {hasRole(['admin', 'manager']) && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Folder Name</label>
                    <Input
                      value={newFolder.name}
                      onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                      placeholder="Enter folder name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newFolder.description}
                      onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newFolder.category} onValueChange={(value) => setNewFolder({ ...newFolder, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
                      {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No folders created yet</p>
            <p className="text-sm text-gray-400">
              Create folders to organize your coach resources
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {folders.map((folder: CoachResourceFolder) => (
              <div key={folder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onFolderSelect(folder.id, folder.name)}
                >
                  <Folder className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{folder.name}</h4>
                    {folder.description && (
                      <p className="text-xs text-gray-500 mt-1">{folder.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {folder.category}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(folder.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                
                {hasRole(['admin', 'manager']) && (
                  <div className="flex gap-1 ml-2">
                    <Dialog open={editingFolder?.id === folder.id} onOpenChange={(open) => !open && setEditingFolder(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Folder</DialogTitle>
                        </DialogHeader>
                        {editingFolder && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Folder Name</label>
                              <Input
                                value={editingFolder.name}
                                onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <Textarea
                                value={editingFolder.description || ''}
                                onChange={(e) => setEditingFolder({ ...editingFolder, description: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Category</label>
                              <Select value={editingFolder.category} onValueChange={(value) => setEditingFolder({ ...editingFolder, category: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingFolder(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateFolder} disabled={updateFolderMutation.isPending}>
                                {updateFolderMutation.isPending ? 'Updating...' : 'Update Folder'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{folder.name}"? This will also delete all files and subfolders inside it. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Folder
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}