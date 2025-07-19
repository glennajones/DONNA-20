import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { PlayerList } from "@/components/members/PlayerList";
import { PlayerForm } from "@/components/members/PlayerForm";
import { ParentList } from "@/components/members/ParentList";
import { ParentForm } from "@/components/members/ParentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Player, Parent } from "@shared/schema";
import { Users, UserCheck } from "lucide-react";

type FormMode = "add-player" | "edit-player" | "add-parent" | "edit-parent" | null;

export default function MembersPage() {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>();
  const [selectedParent, setSelectedParent] = useState<Parent | undefined>();

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setFormMode("edit-player");
  };

  const handleAddPlayer = () => {
    setSelectedPlayer(undefined);
    setFormMode("add-player");
  };

  const handleEditParent = (parent: Parent) => {
    setSelectedParent(parent);
    setFormMode("edit-parent");
  };

  const handleAddParent = () => {
    setSelectedParent(undefined);
    setFormMode("add-parent");
  };

  const handleFormClose = () => {
    setFormMode(null);
    setSelectedPlayer(undefined);
    setSelectedParent(undefined);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Member Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage players and parents in your volleyball club
            </p>
          </div>

          <Tabs defaultValue="players" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Players
              </TabsTrigger>
              <TabsTrigger value="parents" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Parents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-6">
              <PlayerList onEdit={handleEditPlayer} onAdd={handleAddPlayer} />
            </TabsContent>

            <TabsContent value="parents" className="space-y-6">
              <ParentList onEdit={handleEditParent} onAdd={handleAddParent} />
            </TabsContent>
          </Tabs>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#56A0D3]">-</div>
                <p className="text-xs text-muted-foreground">
                  Active members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parents</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#56A0D3]">-</div>
                <p className="text-xs text-muted-foreground">
                  Registered parents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#56A0D3]">8</div>
                <p className="text-xs text-muted-foreground">
                  Age groups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Communication</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#56A0D3]">Ready</div>
                <p className="text-xs text-muted-foreground">
                  System status
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Forms */}
        {(formMode === "add-player" || formMode === "edit-player") && (
          <PlayerForm 
            player={selectedPlayer} 
            onSaved={handleFormClose} 
            onCancel={handleFormClose} 
          />
        )}

        {(formMode === "add-parent" || formMode === "edit-parent") && (
          <ParentForm 
            parent={selectedParent} 
            onSaved={handleFormClose} 
            onCancel={handleFormClose} 
          />
        )}
      </div>
    </ProtectedRoute>
  );
}