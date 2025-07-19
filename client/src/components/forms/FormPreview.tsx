import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FormTemplate } from "@shared/schema";

interface FormPreviewProps {
  template: FormTemplate;
  onClose: () => void;
  previewOnly?: boolean;
}

export function FormPreview({ template, onClose, previewOnly = false }: FormPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [responderName, setResponderName] = useState("");
  const [responderEmail, setResponderEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const updateAnswer = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (previewOnly) {
      toast({
        title: "Preview Mode",
        description: "This is a preview - responses are not saved"
      });
      return;
    }

    if (!responderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    // Check required fields
    const missingFields = template.fields
      .filter(field => field.required && !answers[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in required fields: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/api/forms/templates/${template.id}/responses`, {
        method: "POST",
        body: JSON.stringify({
          responderName: responderName.trim(),
          responderEmail: responderEmail.trim() || null,
          answers
        })
      });

      toast({
        title: "Success",
        description: "Form submitted successfully"
      });

      onClose();
    } catch (error) {
      console.error("Submit form error:", error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = answers[field.id];

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) => updateAnswer(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => updateAnswer(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
            required={field.required}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => updateAnswer(field.id, checked)}
            />
            <label htmlFor={field.id} className="text-sm">
              {field.required && <span className="text-red-500">*</span>}
              Yes, I confirm
            </label>
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => updateAnswer(field.id, e.target.value)}
            required={field.required}
          />
        );

      default:
        return (
          <div className="text-gray-500 italic">
            Field type "{field.type}" not implemented
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{template.name}</h2>
            {previewOnly && (
              <Badge variant="outline" className="mt-1">Preview Mode</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {template.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {template.description}
            </p>
          )}

          {!previewOnly && (
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={responderName}
                    onChange={(e) => setResponderName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={responderEmail}
                    onChange={(e) => setResponderEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.fields.map((field: any) => (
                <div key={field.id}>
                  <label className="text-sm font-medium block mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {previewOnly ? "Close" : "Cancel"}
            </Button>
            {!previewOnly && (
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-[#56A0D3] hover:bg-[#4A90C2]"
              >
                {submitting ? "Submitting..." : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Form
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}