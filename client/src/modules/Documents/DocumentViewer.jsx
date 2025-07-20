import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import SignaturePad from "./SignaturePad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  User, 
  Eye, 
  Shield,
  AlertCircle,
  Calendar
} from "lucide-react";

export default function DocumentViewer({ documentId, onBack }) {
  const [document, setDocument] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [userSignature, setUserSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocument = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      } else {
        throw new Error('Failed to fetch document');
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
      toast({
        title: "Error",
        description: "Failed to load document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchSignatures = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${documentId}/signatures`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setSignatures(data);
        
        // Check if current user has already signed
        const currentUserSignature = data.find(sig => sig.userId === user?.id);
        setUserSignature(currentUserSignature || null);
      } else {
        throw new Error('Failed to fetch signatures');
      }
    } catch (error) {
      console.error('Failed to fetch signatures:', error);
      toast({
        title: "Error",
        description: "Failed to load signatures. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDocument(), fetchSignatures()]);
      setLoading(false);
    };

    if (documentId) {
      loadData();
    }
  }, [documentId]);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${documentId}/download`, {
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

  const handleSignatureComplete = async () => {
    // Refresh signatures after signing
    await fetchSignatures();
    setShowSignaturePad(false);
    toast({
      title: "Success",
      description: "Document signed successfully."
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested document could not be found or you don't have permission to view it.
          </p>
          <Button onClick={onBack}>Back to Documents</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6" />
                {document.title}
              </CardTitle>
              {document.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {document.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline">Version {document.version}</Badge>
                {getStatusBadge(document)}
                <Badge variant="outline">{formatFileSize(document.fileSize)}</Badge>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(document.createdAt).toLocaleDateString()}
                </Badge>
                {document.requiresSignature && (
                  <Badge variant="outline" className="text-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Signature Required
                  </Badge>
                )}
                {document.expirationDate && (
                  <Badge variant="outline" className="text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Expires {new Date(document.expirationDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Document Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            {document.mimeType === 'application/pdf' ? (
              <iframe
                src={`/api/documents/${documentId}/download`}
                className="w-full h-96 border-0"
                title="Document Preview"
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Preview not available for this file type.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Download" above to view the document.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signatures Section */}
      {document.requiresSignature && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Electronic Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Electronic Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userSignature ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Document Signed</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      You signed this document on {new Date(userSignature.signedAt).toLocaleDateString()} at {new Date(userSignature.signedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Your Signature</h4>
                    <div className="border rounded p-2 bg-white dark:bg-gray-800">
                      <img 
                        src={userSignature.signatureData} 
                        alt="Your signature" 
                        className="max-h-20 mx-auto"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Signature Required</span>
                    </div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      This document requires your electronic signature to proceed.
                    </p>
                  </div>
                  {showSignaturePad ? (
                    <SignaturePad 
                      documentId={documentId} 
                      onSignatureComplete={handleSignatureComplete}
                      onCancel={() => setShowSignaturePad(false)}
                    />
                  ) : (
                    <Button 
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Sign Document
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Signature History ({signatures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signatures.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No signatures yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signatures.map((signature) => (
                    <div key={signature.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">User ID: {signature.userId}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {signature.signatureType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Signed on {new Date(signature.signedAt).toLocaleDateString()} at{' '}
                        {new Date(signature.signedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}