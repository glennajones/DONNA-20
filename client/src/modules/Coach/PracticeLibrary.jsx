import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit, Trash2, Upload, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PracticeLibrary() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", drills: "" });
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/practice-plans", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error("Failed to fetch practice plans:", error);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "PDF file must be less than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadPDF = async (planId) => {
    if (!selectedFile) return null;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('planId', planId.toString());
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/practice-plans/upload-pdf', {
        method: 'POST',
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "PDF Uploaded",
          description: "PDF file has been attached to the practice plan."
        });
        return result;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the practice plan.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const drillsArr = form.drills.split(",").map((d) => d.trim()).filter(Boolean);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (editIndex !== null) {
        // Update existing plan
        const planId = plans[editIndex].id;
        const response = await fetch(`/api/practice-plans/${planId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ 
            title: form.title, 
            description: form.description, 
            drills: drillsArr 
          }),
        });

        if (response.ok) {
          const updatedPlan = await response.json();
          
          // Upload PDF if one is selected for the edit
          if (selectedFile) {
            await uploadPDF(updatedPlan.id);
            // Refresh plans to get updated data with PDF info
            await fetchPlans();
          } else {
            const updatedPlans = [...plans];
            updatedPlans[editIndex] = updatedPlan;
            setPlans(updatedPlans);
          }
          
          setEditIndex(null);
          toast({
            title: "Success",
            description: "Practice plan updated successfully."
          });
        }
      } else {
        // Create new plan
        const response = await fetch("/api/practice-plans", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ 
            title: form.title, 
            description: form.description, 
            drills: drillsArr 
          }),
        });

        if (response.ok) {
          const newPlan = await response.json();
          
          // Upload PDF if one is selected
          if (selectedFile) {
            await uploadPDF(newPlan.id);
            // Refresh plans to get updated data with PDF info
            await fetchPlans();
          } else {
            setPlans([newPlan, ...plans]);
          }
          
          toast({
            title: "Success",
            description: "Practice plan created successfully."
          });
        }
      }
      
      setForm({ title: "", description: "", drills: "" });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Failed to save practice plan:", error);
      toast({
        title: "Error",
        description: "Failed to save practice plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (idx) => {
    setEditIndex(idx);
    const plan = plans[idx];
    setForm({
      title: plan.title,
      description: plan.description || "",
      drills: plan.drills.join(", "),
    });
  };

  const handleDelete = async (idx) => {
    if (!confirm("Are you sure you want to delete this practice plan?")) return;
    
    const planId = plans[idx].id;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/practice-plans/${planId}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (response.ok) {
        setPlans(plans.filter((_, i) => i !== idx));
        toast({
          title: "Success",
          description: "Practice plan deleted successfully."
        });
      }
    } catch (error) {
      console.error("Failed to delete practice plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete practice plan. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setForm({ title: "", description: "", drills: "" });
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Practice Library
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Input
            name="title"
            placeholder="Practice Plan Title"
            value={form.title}
            onChange={handleChange}
          />
          <Textarea
            name="description"
            placeholder="Description (optional)"
            value={form.description}
            onChange={handleChange}
          />
          <Input
            name="drills"
            placeholder="Drills (comma separated, e.g., serving, spiking, blocking)"
            value={form.drills}
            onChange={handleChange}
          />
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">
              Attach PDF (Optional)
            </label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {selectedFile.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 10MB. Only PDF files are allowed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {editIndex !== null ? "Update Plan" : "Add Plan"}
            </Button>
            {editIndex !== null && (
              <Button
                onClick={cancelEdit}
                variant="outline"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Plans List */}
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No practice plans yet. Create your first one above!</p>
            </div>
          ) : (
            plans.map((plan, i) => (
              <Card key={plan.id} className="bg-gray-50 dark:bg-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {plan.pdfFileName ? (
                          <button
                            onClick={() => window.open(`/api/practice-plans/${plan.id}/download-pdf`, '_blank')}
                            className="font-semibold text-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                            title="Click to view PDF"
                          >
                            {plan.title}
                          </button>
                        ) : (
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {plan.title}
                          </h3>
                        )}
                        {plan.pdfFileName && (
                          <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-600">
                            <FileText className="h-3 w-3" />
                            PDF
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {plan.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Drills:</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.drills.map((drill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {drill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {plan.pdfFileName && (
                        <div className="mt-2 text-xs text-gray-500">
                          Attached: {plan.pdfFileName} ({Math.round(plan.pdfFileSize / 1024)}KB)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {plan.pdfFileName && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/practice-plans/${plan.id}/download-pdf`, '_blank')}
                          title="Download PDF"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleEdit(i)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(i)}
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}