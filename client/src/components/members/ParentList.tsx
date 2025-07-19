import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Parent, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParentListProps {
  onEdit: (parent: Parent) => void;
  onAdd: () => void;
}

export function ParentList({ onEdit, onAdd }: ParentListProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parents = [], isLoading } = useQuery({
    queryKey: ["/api/parents"],
  });

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/parents/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parents"] });
      toast({
        title: "Success",
        description: "Parent deleted successfully",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete parent",
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

  const getChildrenNames = (childrenIds: number[]) => {
    if (!childrenIds || childrenIds.length === 0) return [];
    return childrenIds
      .map(id => players.find((p: Player) => p.id === id)?.name)
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading parents...</div>
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
              <UserCheck className="h-5 w-5 text-[#56A0D3]" />
              Parents ({parents.length})
            </CardTitle>
            <Button onClick={onAdd} className="bg-[#56A0D3] hover:bg-[#4A8BC2]">
              <Plus className="h-4 w-4 mr-2" />
              Add Parent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {parents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No parents found. Add a parent to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Children</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent: Parent) => {
                    const childrenNames = getChildrenNames(parent.children);
                    return (
                      <tr key={parent.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-3">
                          <div className="font-medium">{parent.name}</div>
                        </td>
                        <td className="p-3">
                          {parent.email ? (
                            <a 
                              href={`mailto:${parent.email}`}
                              className="text-[#56A0D3] hover:underline"
                            >
                              {parent.email}
                            </a>
                          ) : (
                            <span className="text-gray-400">No email</span>
                          )}
                        </td>
                        <td className="p-3">
                          {parent.phone ? (
                            <a 
                              href={`tel:${parent.phone}`}
                              className="text-[#56A0D3] hover:underline"
                            >
                              {parent.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">No phone</span>
                          )}
                        </td>
                        <td className="p-3">
                          {childrenNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {childrenNames.map((name, index) => (
                                <Badge key={index} variant="outline">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No children linked</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(parent)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(parent.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <p className="mb-4">Are you sure you want to delete this parent? This action cannot be undone.</p>
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