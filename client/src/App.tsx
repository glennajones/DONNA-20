import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/login";
import Dashboard from "./pages/dashboard";
import RegistrationPage from "./pages/registration";
import RegistrationSuccessPage from "./pages/registration-success";
import RegistrationsManagementPage from "./pages/registrations-management";
import TrainingPage from "./pages/training";
import MembersPage from "./pages/members";
import CommunicationPage from "./pages/communication";
import FormsPage from "./pages/forms";
import EventsPage from "./pages/events";
import { FundraisingPage } from "./pages/fundraising";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/registration" component={RegistrationPage} />
      <Route path="/registration/success" component={RegistrationSuccessPage} />
      <Route path="/registrations" component={RegistrationsManagementPage} />
      <Route path="/training" component={TrainingPage} />
      <Route path="/members" component={MembersPage} />
      <Route path="/communication" component={CommunicationPage} />
      <Route path="/forms" component={FormsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/fundraising" component={FundraisingPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
