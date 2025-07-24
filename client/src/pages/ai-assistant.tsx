// AI Assistant page for volleyball training recommendations
import Navbar from "@/components/layout/Navbar";
import AIAssistant from "@/modules/Parent/AIAssistant";

export default function AIAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <AIAssistant />
      </main>
    </div>
  );
}