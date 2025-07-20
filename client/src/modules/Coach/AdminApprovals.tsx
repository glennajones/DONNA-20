import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { TimeClockEntry } from "@shared/schema";

export default function AdminApprovals() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Query for pending entries (admin only)
  const { data: pendingEntries, refetch: refetchPending } = useQuery({
    queryKey: ["/api/timeclock/pending"],
    queryFn: async () => {
      const response = await fetch("/api/timeclock/pending", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch pending entries");
      return response.json();
    },
    enabled: user?.role === "admin",
  });

  // Approve/reject mutations
  const approveMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return apiRequest(`/api/timeclock/${entryId}/approve`, "POST");
    },
    onSuccess: () => {
      toast({ title: "Entry Approved", description: "Time entry has been approved" });
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/history"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return apiRequest(`/api/timeclock/${entryId}/reject`, "POST");
    },
    onSuccess: () => {
      toast({ title: "Entry Rejected", description: "Time entry has been rejected" });
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["/api/timeclock/history"] });
    }
  });

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Don't show the component if not admin or no pending entries
  if (user?.role !== "admin") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          Manual Entry Approvals
          {pendingEntries && pendingEntries.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingEntries.length} Pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingEntries && pendingEntries.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Review and approve or reject manual time entries submitted by staff members.
            </p>
            <div className="space-y-4">
              {pendingEntries.map((entry: TimeClockEntry) => (
                <div key={entry.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <div className="font-medium text-gray-900">
                          Manual {entry.action.replace('-', ' ')} Request
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Pending Review
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>User ID:</strong> {entry.userId}</span>
                          <span><strong>Time:</strong> {formatDateTime(entry.timestamp)}</span>
                        </div>
                        <div><strong>Submitted:</strong> {formatDateTime(entry.createdAt || entry.timestamp)}</div>
                      </div>
                      {entry.reason && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                          <div className="text-sm">
                            <strong className="text-gray-700">Reason provided:</strong>
                            <p className="mt-1 text-gray-900">{entry.reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-yellow-200">
                    <Button
                      onClick={() => approveMutation.mutate(entry.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Approve Entry
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(entry.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject Entry
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium mb-2">All caught up!</div>
            <div className="text-sm">No manual time entries pending approval.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}