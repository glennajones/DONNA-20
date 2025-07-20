import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Settings, FileText, Download, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DataSource {
  name: string;
  label: string;
  fields: {
    name: string;
    label: string;
    type: string;
  }[];
}

interface ReportField {
  name: string;
  label: string;
  type: string;
}

interface ReportTemplate {
  name: string;
  description: string;
  dataSource: string;
  fields: ReportField[];
  layout: ReportField[];
  filters: any[];
  outputFormats: string[];
  scheduleConfig: any;
  sharing: number[];
}

export function ReportBuilder() {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<ReportTemplate>({
    name: '',
    description: '',
    dataSource: '',
    fields: [],
    layout: [],
    filters: [],
    outputFormats: ['pdf'],
    scheduleConfig: null,
    sharing: []
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: dataSources } = useQuery({
    queryKey: ["/api/reports/data-sources"],
    queryFn: async () => {
      const response = await apiRequest("/api/reports/data-sources");
      return response.json();
    }
  });

  const saveTemplate = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest("/api/reports/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/templates"] });
      toast({
        title: "Success",
        description: "Report template saved successfully"
      });
      // Reset form
      setTemplate({
        name: '',
        description: '',
        dataSource: '',
        fields: [],
        layout: [],
        filters: [],
        outputFormats: ['pdf'],
        scheduleConfig: null,
        sharing: []
      });
      setStep(1);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save report template",
        variant: "destructive"
      });
    }
  });

  const handleSave = async () => {
    if (!template.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive"
      });
      return;
    }

    if (!template.dataSource) {
      toast({
        title: "Error",
        description: "Please select a data source",
        variant: "destructive"
      });
      return;
    }

    if (template.fields.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field",
        variant: "destructive"
      });
      return;
    }

    saveTemplate.mutate(template);
  };

  const toggleField = (field: ReportField) => {
    const exists = template.fields.find(f => f.name === field.name);
    if (exists) {
      setTemplate(prev => ({
        ...prev,
        fields: prev.fields.filter(f => f.name !== field.name),
        layout: prev.layout.filter(f => f.name !== field.name)
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        fields: [...prev.fields, field]
      }));
    }
  };

  const addToLayout = (field: ReportField) => {
    if (!template.layout.find(f => f.name === field.name)) {
      setTemplate(prev => ({
        ...prev,
        layout: [...prev.layout, field]
      }));
    }
  };

  const removeFromLayout = (fieldName: string) => {
    setTemplate(prev => ({
      ...prev,
      layout: prev.layout.filter(f => f.name !== fieldName)
    }));
  };

  const toggleOutputFormat = (format: string) => {
    const exists = template.outputFormats.includes(format);
    if (exists) {
      setTemplate(prev => ({
        ...prev,
        outputFormats: prev.outputFormats.filter(f => f !== format)
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        outputFormats: [...prev.outputFormats, format]
      }));
    }
  };

  const selectedDataSource = dataSources?.find((ds: DataSource) => ds.name === template.dataSource);
  const canProceed = step === 1 ? (template.name && template.dataSource) : 
                     step === 2 ? template.fields.length > 0 :
                     step === 3 ? template.layout.length > 0 : true;

  const steps = [
    { title: "Basic Info", icon: Settings },
    { title: "Select Fields", icon: FileText },
    { title: "Layout", icon: Eye },
    { title: "Output & Schedule", icon: Download }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((stepInfo, index) => {
              const StepIcon = stepInfo.icon;
              const isActive = step === index + 1;
              const isComplete = step > index + 1;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'bg-[#56A0D3] border-[#56A0D3] text-white' :
                    isComplete ? 'bg-green-500 border-green-500 text-white' :
                    'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-[#56A0D3]' :
                      isComplete ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      Step {index + 1}
                    </div>
                    <div className="text-xs text-gray-500">{stepInfo.title}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Template Name</label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Player Report"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  value={template.description}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this report..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Source</label>
                <Select
                  value={template.dataSource}
                  onValueChange={(value) => setTemplate(prev => ({ ...prev, dataSource: value, fields: [], layout: [] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources?.map((source: DataSource) => (
                      <SelectItem key={source.name} value={source.name}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && selectedDataSource && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Available Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded p-3">
                  {selectedDataSource.fields.map((field) => (
                    <div key={field.name} className="flex items-center space-x-2">
                      <Checkbox
                        checked={template.fields.some(f => f.name === field.name)}
                        onCheckedChange={() => toggleField(field)}
                      />
                      <span className="text-sm">{field.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {field.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {template.fields.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Selected Fields ({template.fields.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.fields.map((field) => (
                      <Badge key={field.name} variant="default">
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Available Fields</h3>
                  <div className="space-y-2 border rounded p-3 max-h-48 overflow-y-auto">
                    {template.fields.map((field) => (
                      <Button
                        key={field.name}
                        variant="outline"
                        size="sm"
                        onClick={() => addToLayout(field)}
                        className="w-full justify-start text-left"
                        disabled={template.layout.some(f => f.name === field.name)}
                      >
                        {field.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Report Layout</h3>
                  <div className="border rounded p-3 min-h-48 bg-gray-50">
                    {template.layout.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Add fields from the left to build your report layout
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {template.layout.map((field, index) => (
                          <div
                            key={field.name}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <span className="text-sm font-medium">{field.label}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromLayout(field.name)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Output Formats</label>
                <div className="flex gap-4">
                  {['pdf', 'csv', 'excel'].map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        checked={template.outputFormats.includes(format)}
                        onCheckedChange={() => toggleOutputFormat(format)}
                      />
                      <span className="text-sm capitalize">{format}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium mb-2 block">Schedule (Optional)</label>
                <Input
                  placeholder="e.g., 0 0 1 * * (monthly on 1st at midnight)"
                  onChange={(e) => setTemplate(prev => ({
                    ...prev,
                    scheduleConfig: e.target.value ? { cron: e.target.value, timeZone: 'UTC' } : null
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cron expression for automatic report generation (leave empty for manual generation)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {step < 4 ? (
            <Button
              onClick={() => setStep(Math.min(4, step + 1))}
              disabled={!canProceed}
              className="bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saveTemplate.isPending || !canProceed}
              className="bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {saveTemplate.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}