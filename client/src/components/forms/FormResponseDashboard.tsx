import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle2, Clock, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { FormTemplate, FormResponse } from "@shared/schema";

export function FormResponseDashboard() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { data: templates } = useQuery({
    queryKey: ["/api/forms/templates"],
    queryFn: async () => {
      const response = await apiRequest("/api/forms/templates");
      return response.json();
    }
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ["/api/forms/responses", selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      const response = await apiRequest(`/api/forms/templates/${selectedTemplateId}/responses`);
      return response.json();
    },
    enabled: !!selectedTemplateId
  });

  const selectedTemplate = templates?.find((t: FormTemplate) => t.id === selectedTemplateId);

  const getResponseStats = (responses: FormResponse[]) => {
    const total = responses.length;
    const completed = responses.filter(r => r.status === "completed").length;
    return { total, completed, pending: total - completed };
  };

  const formatFieldValue = (field: any, value: any) => {
    if (field.type === "checkbox") {
      return value ? "✓ Yes" : "✗ No";
    }
    if (field.type === "date" && value) {
      return new Date(value).toLocaleDateString();
    }
    return value || "—";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#56A0D3]" />
            Form Response Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!templates || templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No form templates available. Create a form template first.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {templates.map((template: FormTemplate) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplateId === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={selectedTemplateId === template.id ? "bg-[#56A0D3] hover:bg-[#4A90C2]" : ""}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                    {selectedTemplate.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>

                  {responsesLoading ? (
                    <div className="text-center py-8">Loading responses...</div>
                  ) : (
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="responses">All Responses</TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-4">
                        {responses && responses.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(() => {
                              const stats = getResponseStats(responses);
                              return (
                                <>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-[#56A0D3]">{stats.total}</div>
                                      <div className="text-sm text-gray-600">Total Responses</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                                      <div className="text-sm text-gray-600">Completed</div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                                      <div className="text-sm text-gray-600">Pending</div>
                                    </CardContent>
                                  </Card>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No responses received yet for this form.
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="responses">
                        {responses && responses.length > 0 ? (
                          <div className="space-y-4">
                            {responses.map((response: FormResponse) => (
                              <Card key={response.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">{response.responderName}</span>
                                      {response.responderEmail && (
                                        <span className="text-sm text-gray-600">{response.responderEmail}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={response.status === "completed" ? "default" : "secondary"}
                                        className={response.status === "completed" ? "bg-green-100 text-green-800" : ""}
                                      >
                                        {response.status === "completed" ? (
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                        ) : (
                                          <Clock className="h-3 w-3 mr-1" />
                                        )}
                                        {response.status}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {new Date(response.submittedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedTemplate.fields.map((field: any) => (
                                      <div key={field.id} className="border rounded p-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          {field.label}
                                        </div>
                                        <div className="text-sm">
                                          {formatFieldValue(field, response.answers[field.id])}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No responses received yet for this form.
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}