import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, X, Type, CheckSquare, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FormField {
  id: string;
  type: "text" | "checkbox" | "date" | "textarea" | "select";
  label: string;
  required?: boolean;
  options?: string[];
}

interface FormTemplate {
  name: string;
  description?: string;
  fields: FormField[];
}

export function FormBuilder() {
  const [template, setTemplate] = useState<FormTemplate>({
    name: "",
    description: "",
    fields: []
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fieldTypes = [
    { type: "text", label: "Text Input", icon: Type },
    { type: "checkbox", label: "Checkbox", icon: CheckSquare },
    { type: "date", label: "Date", icon: Calendar },
    { type: "textarea", label: "Text Area", icon: FileText }
  ];

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `New ${type} field`,
      required: false
    };
    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== id)
    }));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(template.fields);
    const [moved] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, moved);

    setTemplate(prev => ({
      ...prev,
      fields: reorderedFields
    }));
  };

  const handleSave = async () => {
    if (!template.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a form name",
        variant: "destructive"
      });
      return;
    }

    if (template.fields.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one field",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/api/forms/templates", {
        method: "POST",
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          fields: template.fields,
          createdBy: user?.id
        })
      });

      toast({
        title: "Success",
        description: "Form template saved successfully"
      });

      // Invalidate templates query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/forms/templates"] });

      // Reset form
      setTemplate({ name: "", description: "", fields: [] });
    } catch (error) {
      console.error("Save template error:", error);
      toast({
        title: "Error",
        description: "Failed to save form template",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#56A0D3]" />
            Form Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Form Name</label>
              <Input
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Equipment Checklist"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                value={template.description || ""}
                onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this form..."
                rows={2}
              />
            </div>
          </div>

          {/* Field Type Buttons */}
          <div>
            <label className="text-sm font-medium mb-3 block">Add Fields</label>
            <div className="flex flex-wrap gap-2">
              {fieldTypes.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addField(type as FormField["type"])}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="text-sm font-medium mb-3 block">Form Fields</label>
            {template.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No fields added yet. Click the buttons above to add form fields.
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {template.fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border rounded-lg p-4 bg-white dark:bg-gray-800 ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div {...provided.dragHandleProps} className="mt-1">
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{field.type}</Badge>
                                    <Input
                                      value={field.label}
                                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                                      className="flex-1"
                                      placeholder="Field label"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeField(field.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`required-${field.id}`}
                                      checked={field.required || false}
                                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    />
                                    <label htmlFor={`required-${field.id}`} className="text-sm">
                                      Required field
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving || !template.name.trim() || template.fields.length === 0}
              className="bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {saving ? "Saving..." : "Save Form Template"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}