import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Upload, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";

export default function DocumentRepo({ onViewDocument }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    version: '1.0',
    allowedRoles: ['admin', 'manager'],
    requiresSignature: false,
    expirationType: 'never',
    expirationDate: '',
    file: null
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    version: '',
    requiresSignature: false,
    allowedRoles: []
  });

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/documents', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.title) {
      toast({
        title: "Validation Error",
        description: "Please provide a title and select a file.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('version', uploadForm.version);
      formData.append('allowedRoles', JSON.stringify(uploadForm.allowedRoles));
      formData.append('requiresSignature', uploadForm.requiresSignature.toString());
      formData.append('expirationType', uploadForm.expirationType);
      if (uploadForm.expirationDate) {
        formData.append('expirationDate', uploadForm.expirationDate);
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        await fetchDocuments();
        setUploadDialogOpen(false);
        setUploadForm({
          title: '',
          description: '',
          version: '1.0',
          allowedRoles: ['admin', 'manager'],
          requiresSignature: false,
          expirationType: 'never',
          expirationDate: '',
          file: null
        });
        toast({
          title: "Success",
          description: "Document uploaded successfully."
        });
      } else {
        throw new Error('Failed to upload document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (document) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${document.id}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Document downloaded successfully."
        });
      } else {
        throw new Error('Failed to download document');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (documentId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        await fetchDocuments();
        toast({
          title: "Success",
          description: "Document deleted successfully."
        });
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (document) => {
    setSelectedDocument(document);
    setEditForm({
      title: document.title,
      description: document.description || '',
      version: document.version,
      requiresSignature: document.requiresSignature,
      allowedRoles: document.allowedRoles || ['admin', 'manager']
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.title) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchDocuments();
        setEditDialogOpen(false);
        setSelectedDocument(null);
        toast({
          title: "Success",
          description: "Document updated successfully."
        });
      } else {
        throw new Error('Failed to update document');
      }
    } catch (error) {
      console.error('Failed to update document:', error);
      toast({
        title: "Error",
        description: "Failed to update document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (document) => {
    if (document.status === 'active') {
      if (document.expirationDate && new Date(document.expirationDate) < new Date()) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Archived</Badge>;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload New Document */}
      {["admin", "manager"].includes(user?.role) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files[0] }))}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Accepted formats: PDF, DOC, DOCX, TXT (max 10MB)
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Document title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the document"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0"
                    />
                  </div>

                  <div>
                    <Label>Access Permissions</Label>
                    <div className="space-y-2 mt-2">
                      {['admin', 'manager', 'coach'].map(role => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox
                            id={role}
                            checked={uploadForm.allowedRoles.includes(role)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setUploadForm(prev => ({
                                  ...prev,
                                  allowedRoles: [...prev.allowedRoles, role]
                                }));
                              } else {
                                setUploadForm(prev => ({
                                  ...prev,
                                  allowedRoles: prev.allowedRoles.filter(r => r !== role)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={role} className="capitalize">{role}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresSignature"
                        checked={uploadForm.requiresSignature}
                        onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, requiresSignature: checked }))}
                      />
                      <Label htmlFor="requiresSignature" className="font-medium">
                        Requires Electronic Signature
                      </Label>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Check this box to enable e-signature functionality for this document. Users will need to electronically sign before accessing.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Upload Document
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setUploadDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Repository ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              {["admin", "manager"].includes(user?.role) && (
                <p className="text-sm mt-2">Upload your first document to get started.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {document.title}
                        </div>
                        {document.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {document.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {document.requiresSignature ? (
                            <Badge variant="default" className="text-xs bg-blue-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Signature Required
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              No Signature Required
                            </Badge>
                          )}
                          {document.expirationDate && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires {new Date(document.expirationDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{document.version}</TableCell>
                    <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                    <TableCell>{getStatusBadge(document)}</TableCell>
                    <TableCell>
                      {document.requiresSignature ? (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          View Signatures
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDocument(document.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(document)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                        {["admin", "manager"].includes(user?.role) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(document)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            {user?.role === "admin" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="flex items-center gap-1">
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{document.title}"? This action cannot be undone and will remove all associated signatures and audit logs.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(document.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Document Dialog */}
      {selectedDocument && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-version">Version</Label>
                <Input
                  id="edit-version"
                  value={editForm.version}
                  onChange={(e) => setEditForm(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0"
                />
              </div>

              <div>
                <Label>Access Permissions</Label>
                <div className="space-y-2 mt-2">
                  {['admin', 'manager', 'coach'].map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${role}`}
                        checked={editForm.allowedRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditForm(prev => ({
                              ...prev,
                              allowedRoles: [...prev.allowedRoles, role]
                            }));
                          } else {
                            setEditForm(prev => ({
                              ...prev,
                              allowedRoles: prev.allowedRoles.filter(r => r !== role)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`edit-${role}`} className="capitalize">{role}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-requiresSignature"
                    checked={editForm.requiresSignature}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, requiresSignature: checked }))}
                  />
                  <Label htmlFor="edit-requiresSignature" className="font-medium">
                    Requires Electronic Signature
                  </Label>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Enable electronic signature requirement for this document.
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update Document
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}