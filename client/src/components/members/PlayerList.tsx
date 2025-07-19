import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerListProps {
  onEdit: (player: Player) => void;
  onAdd: () => void;
}

export function PlayerList({ onEdit, onAdd }: PlayerListProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["/api/players"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/players/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete player",
        variant: "destructive",
      });
    }
  });

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "suspended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading players...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#56A0D3]" />
              Players ({players.length})
            </CardTitle>
            <Button onClick={onAdd} className="bg-[#56A0D3] hover:bg-[#4A8BC2]">
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No players found. Add a player to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Age</th>
                    <th className="text-left p-3 font-medium">Teams</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Communication</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player: Player) => (
                    <tr key={player.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {player.contact && (
                            <div className="text-sm text-gray-500">{player.contact}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">{calculateAge(player.dateOfBirth)}</td>
                      <td className="p-3">
                        {player.teams && player.teams.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {player.teams.map((team, index) => (
                              <Badge key={index} variant="outline">
                                {team}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No teams</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(player.status)}>
                          {player.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {player.communicationPreference ? (
                          <Badge variant="secondary">
                            {player.communicationPreference}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">None set</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(player)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(player.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Are you sure you want to delete this player? This action cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteId(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}