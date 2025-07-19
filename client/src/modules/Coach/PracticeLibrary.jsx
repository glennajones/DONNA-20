import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PracticeLibrary() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", drills: "" });
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
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
          const updatedPlans = [...plans];
          updatedPlans[editIndex] = updatedPlan;
          setPlans(updatedPlans);
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
          setPlans([newPlan, ...plans]);
          toast({
            title: "Success",
            description: "Practice plan created successfully."
          });
        }
      }
      
      setForm({ title: "", description: "", drills: "" });
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
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {plan.title}
                      </h3>
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
                    </div>
                    <div className="flex gap-2 ml-4">
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