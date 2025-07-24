import EnhancedCoachManagement from '@/modules/Admin/EnhancedCoachManagement';
import { Navbar } from '@/components/layout/Navbar';

export default function EnhancedCoachManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <EnhancedCoachManagement />
      </div>
    </div>
  );
}