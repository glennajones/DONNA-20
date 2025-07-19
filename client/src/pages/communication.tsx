import { ChatRoom } from "@/components/communication/ChatRoom";
import { DashboardNav } from "@/components/ui/dashboard-nav";

export default function CommunicationPage() {
  return (
    <div className="container mx-auto p-6 h-full">
      <DashboardNav title="Communication Hub" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communication Hub</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Send messages to all team members and track delivery status across different communication channels.
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <ChatRoom />
      </div>
    </div>
  );
}