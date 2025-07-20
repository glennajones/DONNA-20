import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PenTool, 
  RotateCcw, 
  CheckCircle, 
  X,
  Type
} from "lucide-react";

export default function SignaturePad({ documentId, onSignatureComplete, onCancel }) {
  const [signatureType, setSignatureType] = useState('canvas');
  const [typedSignature, setTypedSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };

  const handleSubmitSignature = async () => {
    let signatureData = '';
    
    if (signatureType === 'canvas') {
      if (canvasRef.current && canvasRef.current.isEmpty()) {
        toast({
          title: "Error",
          description: "Please provide a signature before submitting.",
          variant: "destructive"
        });
        return;
      }
      signatureData = canvasRef.current.toDataURL();
    } else if (signatureType === 'typed') {
      if (!typedSignature.trim()) {
        toast({
          title: "Error", 
          description: "Please enter your name for the typed signature.",
          variant: "destructive"
        });
        return;
      }
      // Create a simple typed signature as data URL
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Set background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text properties
      ctx.fillStyle = 'black';
      ctx.font = '32px cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw the typed signature
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
      
      signatureData = canvas.toDataURL();
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/documents/${documentId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          signatureData,
          signatureType
        })
      });

      if (response.ok) {
        onSignatureComplete();
        toast({
          title: "Success",
          description: "Document signed successfully."
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sign document');
      }
    } catch (error) {
      console.error('Failed to sign document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Electronic Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={signatureType} onValueChange={setSignatureType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="canvas" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="typed" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Type
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="space-y-4">
            <div>
              <Label>Draw your signature in the box below</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800 mt-2">
                <SignatureCanvas
                  ref={canvasRef}
                  canvasProps={{
                    width: 400,
                    height: 150,
                    className: 'signature-canvas w-full h-auto'
                  }}
                  backgroundColor="rgba(255,255,255,0)"
                  penColor="black"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearCanvas}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </Button>
                <p className="text-sm text-gray-500">
                  Use your mouse or touch to draw your signature
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typed" className="space-y-4">
            <div>
              <Label htmlFor="typed-signature">Type your full name</Label>
              <Input
                id="typed-signature"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Enter your full name"
                className="mt-2 text-2xl font-serif text-center"
                style={{ fontFamily: 'cursive' }}
              />
              <p className="text-sm text-gray-500 mt-2">
                This will create a typed signature using your name in cursive style
              </p>
            </div>
            {typedSignature && (
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                <Label className="text-sm text-gray-600">Preview:</Label>
                <div className="text-center py-4">
                  <span className="text-3xl" style={{ fontFamily: 'cursive' }}>
                    {typedSignature}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Legal Notice */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Electronic Signature Agreement:</strong> By clicking "Sign Document" below, 
            you agree that your electronic signature has the same legal force and effect as a 
            handwritten signature. You acknowledge that you have read and understood this document.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSubmitSignature} 
            disabled={isSubmitting}
            className="flex-1 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {isSubmitting ? 'Signing...' : 'Sign Document'}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}