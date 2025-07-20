import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Volleyball, LogOut, User, Settings, Users } from "lucide-react";
import { Link } from "wouter";

export function Navbar() {
  const { user, logout, hasRole } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "coach":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Volleyball className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-gray-900">VolleyClub Pro</h1>
            </div>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/dashboard" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-primary text-sm font-medium">
                Dashboard
              </Link>
              
              {hasRole(["admin", "manager"]) && (
                <Link href="/registrations" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Registrations
                </Link>
              )}
              
              {hasRole(["admin", "manager"]) && (
                <Link href="/members" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Members
                </Link>
              )}
              
              {hasRole(["admin", "manager", "coach"]) && (
                <Link href="/training" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Training
                </Link>
              )}
              
              {hasRole(["admin", "manager"]) && (
                <Link href="/communication" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Communication
                </Link>
              )}
              
              {hasRole(["admin", "manager"]) && (
                <Link href="/forms" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Forms
                </Link>
              )}
              
              {hasRole(["admin", "manager"]) && (
                <Link href="/events" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Events
                </Link>
              )}
              
              {hasRole(["admin", "manager", "coach"]) && (
                <Link href="/coach-resources" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Coach Resources
                </Link>
              )}
              
              <Link href="/player-dashboard" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                Player Zone
              </Link>
              
              <Link href="/parent-dashboard" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                Parent Zone
              </Link>
              
              <a 
                href="https://www.unitedvolleyball.club/pages/better-together-a-united-podcast" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium cursor-pointer"
              >
                Podcast
              </a>
              
              {hasRole("admin") && (
                <Link href="/admin-settings" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">
                  Admin Settings
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant={getRoleBadgeVariant(user?.role || "")}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Badge>
            
            <span className="text-sm text-gray-700">{user?.name}</span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
