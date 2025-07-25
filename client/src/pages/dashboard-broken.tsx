import { useAuth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import TimeClockWidget from "@/components/widgets/TimeClockWidget";
import { 
  Users, 
  Calendar, 
  Trophy, 
  UserCheck, 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  Settings,
  Shield,
  Database,
  BarChart3,
  UserCog,
  TriangleAlert,
  Heart,
  TrendingUp,
  Link as LinkIcon
} from "lucide-react";

export default function Dashboard() {
  const { user, hasRole } = useAuth();

  const stats = [
    {
      title: "Active Players",
      value: "24",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Training Sessions",
      value: "12",
      icon: Calendar,
      color: "text-orange-500",
    },
    {
      title: "Tournaments",
      value: "3",
      icon: Trophy,
      color: "text-yellow-500",
      roles: ["admin", "manager"],
    },
    {
      title: "Staff Members",
      value: "8",
      icon: UserCheck,
      color: "text-green-500",
      roles: ["admin"],
    },
  ];

  const quickActions = [
    {
      title: "New Registration",
      icon: UserPlus,
      color: "bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary",
      href: "/registration",
    },
    {
      title: "Manage Registrations",
      icon: FileText,
      color: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
      roles: ["admin", "manager"],
      href: "/registrations",
    },
    {
      title: "Schedule Training",
      icon: CalendarPlus,
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700",
      roles: ["admin", "coach"],
      href: "/training",
    },
    {
      title: "Fundraising",
      icon: Heart,
      color: "bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700",
      roles: ["admin", "manager"],
      href: "/fundraising",
    },
    {
      title: "Performance Tracking",
      icon: TrendingUp,
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700",
      roles: ["admin", "manager", "coach"],
      href: "/performance",
    },
    {
      title: "Coach Resources",
      icon: UserCog,
      color: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700",
      roles: ["admin", "manager", "coach"],
      href: "/coach-resources",
    },
    {
      title: "Volleyball Podcast",
      icon: LinkIcon,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700",
      href: "/podcast",
    },
    {
      title: "Integrations",
      icon: LinkIcon,
      color: "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700",
      roles: ["admin"],
      href: "/integrations",
    },
    {
      title: "Documents & e-Signatures",
      icon: FileText,
      color: "bg-red-50 hover:bg-red-100 border-red-200 text-red-700",
      roles: ["admin", "manager", "coach"],
      href: "/documents",
    },
    {
      title: "System Settings",
      icon: Settings,
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700",
      roles: ["admin"],
    },
  ];

  const adminActions = [
    {
      title: "User Management",
      description: "Manage user roles and permissions",
      icon: UserCog,
      color: "text-blue-500",
    },
    {
      title: "System Backup",
      description: "Backup and restore data",
      icon: Database,
      color: "text-green-500",
    },
    {
      title: "Analytics",
      description: "View detailed system analytics",
      icon: BarChart3,
      color: "text-purple-500",
    },
  ];

  const activities = [
    {
      icon: UserPlus,
      text: "New player Sarah Johnson joined the team",
      time: "2h ago",
      color: "bg-green-500",
    },
    {
      icon: Calendar,
      text: "Training session scheduled for tomorrow",
      time: "4h ago",
      color: "bg-blue-500",
    },
    {
      icon: Trophy,
      text: "Tournament registration opens next week",
      time: "1d ago",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your volleyball club today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            if (stat.roles && !hasRole(stat.roles)) return null;
            
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== activities.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full ${activity.color} flex items-center justify-center ring-8 ring-white`}>
                                <Icon className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">{activity.text}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {activity.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Time Clock Widget for Coaches */}
            {hasRole(["coach"]) && (
              <TimeClockWidget />
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  if (action.roles && !hasRole(action.roles)) return null;
                  
                  const Icon = action.icon;
                  const ActionButton = (
                    <Button
                      key={action.title}
                      variant="outline"
                      className={`w-full justify-between h-auto py-3 ${action.color}`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-3" />
                        <span className="text-sm font-medium">{action.title}</span>
                      </div>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  );

                  if (action.href) {
                    return (
                      <Link key={action.title} href={action.href}>
                        {ActionButton}
                      </Link>
                    );
                  }

                  return ActionButton;
                })}
              </div>
            </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Control Panel */}
        {hasRole("admin") && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 text-red-500 mr-2" />
                Admin Control Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <TriangleAlert className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">
                      This section is only visible to users with Admin role.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adminActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.title}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start">
                        <Icon className={`h-5 w-5 ${action.color} mt-0.5 mr-3`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{action.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
