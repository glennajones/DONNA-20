import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Plus, Check, X, AlertCircle, History, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { TimeClockEntry } from "@shared/schema";

export default function TimeClock() {
  const [clockedIn, setClockedIn] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [lastClockIn, setLastClockIn] = useState<number | null>(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualAction, setManualAction] = useState<"clock-in" | "clock-out">("clock-in");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualReason, setManualReason] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Query for today's time clock entries
  const { data: todayEntries, refetch: refetchToday } = useQuery({
    queryKey: ["/api/timeclock/today"],
    queryFn: async () => {
      const response = await fetch("/api/timeclock/today", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch today's entries");
      return response.json();
    },
  });

  // Query for time clock history
  const { data: historyEntries } = useQuery({
    queryKey: ["/api/timeclock/history"],
    queryFn: async () => {
      const response = await fetch("/api/timeclock/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  // Query for pending entries (admin only)
  const { data: pendingEntries, refetch: refetchPending } = useQuery({
    queryKey: ["/api/timeclock/pending"],
    queryFn: async () => {
      if (user?.role !== "admin") return [];
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

  // Calculate hours and status from today's entries
  useEffect(() => {
    if (todayEntries) {
      calculateHours(todayEntries);
    }
  }, [todayEntries]);

  const calculateHours = (entries: TimeClockEntry[]) => {
    let total = 0;
    let currentClockIn = null;
    let isClockedIn = false;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedEntries.forEach(entry => {
      if (entry.action === "clock-in") {
        currentClockIn = new Date(entry.timestamp);
        setLastClockIn(currentClockIn.getTime());
        isClockedIn = true;
      } else if (entry.action === "clock-out" && currentClockIn) {
        const clockOut = new Date(entry.timestamp);
        const hours = (clockOut.getTime() - currentClockIn.getTime()) / (1000 * 60 * 60);
        total += hours;
        currentClockIn = null;
        isClockedIn = false;
      }
    });

    if (isClockedIn && currentClockIn) {
      const now = new Date();
      const currentHours = (now.getTime() - currentClockIn.getTime()) / (1000 * 60 * 60);
      total += currentHours;
    }

    setTotalHours(total);
    setClockedIn(isClockedIn);
  };

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async (action: "clock-in" | "clock-out") => {
      return apiRequest("/api/timeclock", "POST", { action });
    },
    onSuccess: () => {
      toast({
        title: clockedIn ? "Clocked Out" : "Clocked In",
        description: clockedIn ? "Your time has been recorded" : "Timer started successfully"
      });
      refetchToday();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record time entry",
        variant: "destructive"
      });
    }
  });

  // Manual entry mutation
  const manualEntryMutation = useMutation({
    mutationFn: async (data: { action: string; timestamp: string; reason: string; isManual: boolean }) => {
      return apiRequest("/api/timeclock", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Manual Entry Submitted",
        description: "Your manual time entry has been submitted for admin approval"
      });
      setManualEntryOpen(false);
      setManualReason("");
      refetchToday();
      if (user?.role === "admin") refetchPending();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit manual entry",
        variant: "destructive"
      });
    }
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
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (entryId: number) => {
      return apiRequest(`/api/timeclock/${entryId}/reject`, "POST");
    },
    onSuccess: () => {
      toast({ title: "Entry Rejected", description: "Time entry has been rejected" });
      refetchPending();
    }
  });

  const handleClockAction = () => {
    const action = clockedIn ? "clock-out" : "clock-in";
    clockMutation.mutate(action);
  };

  const handleManualEntry = () => {
    if (!manualDate || !manualTime || !manualReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields for manual entry",
        variant: "destructive"
      });
      return;
    }

    const timestamp = `${manualDate}T${manualTime}:00`;
    manualEntryMutation.mutate({
      action: manualAction,
      timestamp,
      reason: manualReason,
      isManual: true
    });
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Time Clock System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current Status</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              {user?.role === "admin" && (
                <TabsTrigger value="pending">
                  Pending Approval {pendingEntries?.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                      {pendingEntries.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Current Status Tab */}
            <TabsContent value="current" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <Badge variant={clockedIn ? "default" : "secondary"} className="text-sm">
                    {clockedIn ? "Clocked In" : "Clocked Out"}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Today's Hours</div>
                  <div className="font-semibold text-blue-600 text-lg">
                    {formatTime(totalHours)}
                  </div>
                </div>
              </div>

              {clockedIn && lastClockIn && (
                <div className="text-center text-sm text-gray-500">
                  Started: {new Date(lastClockIn).toLocaleTimeString()}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleClockAction}
                  disabled={clockMutation.isPending}
                  className={`flex-1 ${clockedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {clockMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      {clockedIn ? (
                        <Square className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {clockedIn ? "Clock Out" : "Clock In"}
                    </>
                  )}
                </Button>

                <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Manual Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Manual Time Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Manual Entry Process:</strong> This entry will be submitted to administrators for approval. 
                          You'll be able to see the status in your History tab. Please provide a clear reason for the manual entry.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="action">Action</Label>
                        <select
                          id="action"
                          value={manualAction}
                          onChange={(e) => setManualAction(e.target.value as "clock-in" | "clock-out")}
                          className="w-full p-2 border rounded"
                        >
                          <option value="clock-in">Clock In</option>
                          <option value="clock-out">Clock Out</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reason">Reason for Manual Entry</Label>
                        <Textarea
                          id="reason"
                          value={manualReason}
                          onChange={(e) => setManualReason(e.target.value)}
                          placeholder="Explain why you need to manually add this time entry..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleManualEntry}
                          disabled={manualEntryMutation.isPending}
                          className="flex-1"
                        >
                          {manualEntryMutation.isPending ? "Submitting..." : "Submit for Approval"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setManualEntryOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {historyEntries && historyEntries.length > 0 ? (
                  historyEntries.slice(0, 20).map((entry: TimeClockEntry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{entry.action.replace('-', ' ')}</div>
                        <div className="text-sm text-gray-600">{formatDateTime(entry.timestamp)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.isManual && (
                          <Badge variant="secondary" className="text-xs">
                            Manual
                          </Badge>
                        )}
                        <Badge 
                          variant={entry.status === 'approved' ? 'default' : entry.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {entry.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No time entries found
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pending Approval Tab (Admin Only) */}
            {user?.role === "admin" && (
              <TabsContent value="pending" className="space-y-4">
                <div className="space-y-3">
                  {pendingEntries && pendingEntries.length > 0 ? (
                    pendingEntries.map((entry: TimeClockEntry & { user?: { name: string } }) => (
                      <div key={entry.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium">
                              Manual {entry.action.replace('-', ' ')} Request
                            </div>
                            <div className="text-sm text-gray-600">
                              User ID: {entry.userId} • {formatDateTime(entry.timestamp)}
                            </div>
                            {entry.reason && (
                              <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border">
                                <strong>Reason:</strong> {entry.reason}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(entry.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(entry.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No pending approvals
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}