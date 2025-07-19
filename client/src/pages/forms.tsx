import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { FormTemplateManager } from "@/components/forms/FormTemplateManager";
import { FormResponseDashboard } from "@/components/forms/FormResponseDashboard";
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Forms & Checklists
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage forms, track responses, and streamline club operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          {canCreateForms && <TabsTrigger value="builder">Form Builder</TabsTrigger>}
          <TabsTrigger value="responses">Responses</TabsTrigger>
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
      </Tabs>
    </div>
  );
}