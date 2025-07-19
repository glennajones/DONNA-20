import RegistrationForm from "@/components/registration/RegistrationForm";
import { DashboardNav } from "@/components/ui/dashboard-nav";

export default function RegistrationPage() {
  return (
    <div>
      <div className="container mx-auto p-6">
        <DashboardNav title="Player Registration" />
      </div>
      <RegistrationForm />
    </div>
  );
}