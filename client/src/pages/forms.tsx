import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { FormTemplateManager } from "@/components/forms/FormTemplateManager";
import { FormResponseDashboard } from "@/components/forms/FormResponseDashboard";
import { ReportBuilder } from "@/components/reports/ReportBuilder";
import { ReportTemplateManager } from "@/components/reports/ReportTemplateManager";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import { useAuth } from "@/lib/auth";
import type { FormTemplate } from "@shared/schema";

export default function FormsPage() {
  const [activeTab, setActiveTab] = useState("templates");
  const { user } = useAuth();

  // Preview is now handled within FormTemplateManager

  const handleSendToPlayers = (template: FormTemplate) => {
    // This could integrate with the communication system
    alert(`Send "${template.name}" to all players via their communication preferences`);
  };

  const canCreateForms = user?.role === "admin" || user?.role === "manager";

  console.log("Forms page - current user:", user);

  return (
    <div className="container mx-auto p-6">
      <DashboardNav title="Forms & Checklists" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Forms, Checklists & Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage forms, track responses, generate reports, and streamline club operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Form Templates</TabsTrigger>
          {canCreateForms && <TabsTrigger value="builder">Form Builder</TabsTrigger>}
          <TabsTrigger value="responses">Form Responses</TabsTrigger>
          <TabsTrigger value="report-templates">Report Templates</TabsTrigger>
          {canCreateForms && <TabsTrigger value="report-builder">Report Builder</TabsTrigger>}
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          {user ? (
            <FormTemplateManager 
              onSendToPlayers={handleSendToPlayers}
            />
          ) : (
            <div className="text-center py-8">
              <p>Please log in to access forms.</p>
            </div>
          )}
        </TabsContent>

        {canCreateForms && (
          <TabsContent value="builder" className="mt-6">
            <FormBuilder />
          </TabsContent>
        )}

        <TabsContent value="responses" className="mt-6">
          <FormResponseDashboard />
        </TabsContent>

        <TabsContent value="report-templates" className="mt-6">
          {user ? (
            <ReportTemplateManager />
          ) : (
            <div className="text-center py-8">
              <p>Please log in to access report templates.</p>
            </div>
          )}
        </TabsContent>

        {canCreateForms && (
          <TabsContent value="report-builder" className="mt-6">
            <ReportBuilder />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}