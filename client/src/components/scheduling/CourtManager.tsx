import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScheduleEvent, insertScheduleEventSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TimeSelect } from "@/components/ui/time-select";

// Form schema that extends the base schema
const formSchema = insertScheduleEventSchema.extend({
  participants: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CourtManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Available courts: 7 indoor + 2 beach (must match CalendarView courts exactly)
  const courts = [
    "Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7",
    "Beach 1", "Beach 2",
  ];

  // Fetch current schedule to check court availability
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["/api/schedule"],
    queryFn: async () => {
      const response = await fetch("/api/schedule", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch schedule");
      return response.json();
    },
  });

  const events = scheduleData?.events || [];

  // Form handling
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      court: "",
      date: "",
      time: "",
      eventType: "training",
      participants: "",
      coach: "",
      duration: 120,
      title: "",
      description: "",
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        participants: data.participants ? data.participants.split(",").map(p => p.trim()).filter(Boolean) : [],
      };
      return apiRequest("/api/schedule", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      setIsModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Training session scheduled successfully!",
      });
    },
    onError: (error: any) => {
      if (error.error === "conflict") {
        toast({
          variant: "destructive",
          title: "Scheduling Conflict",
          description: "This court is already booked for the selected time. Please choose a different time slot.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to schedule session. Please try again.",
        });
      }
    },
  });

  const openModal = (court: string) => {
    setSelectedCourt(court);
    form.setValue("court", court);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: FormData) => {
    createEventMutation.mutate(data);
  };

  // Check if court is currently booked (simplified check for today)
  const isCourtBooked = (court: string) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    return events.some((event: ScheduleEvent) => {
      if (event.court !== court || event.date !== today) return false;
      
      // Check if current time is within event duration
      const [eventHours, eventMinutes] = event.time.split(':').map(Number);
      const eventStartMinutes = eventHours * 60 + eventMinutes;
      const eventEndMinutes = eventStartMinutes + (event.duration || 120);
      
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      
      return currentTotalMinutes >= eventStartMinutes && currentTotalMinutes < eventEndMinutes;
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🏟️ Court Manager</h2>
        <p className="text-sm text-gray-600">
          Click on a court to schedule a training session
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {courts.map((court) => {
          const isBooked = isCourtBooked(court);
          const courtEvents = events.filter((e: ScheduleEvent) => e.court === court);
          
          return (
            <Card
              key={court}
              className={`cursor-pointer transition-colors hover:shadow-md ${
                isBooked
                  ? "bg-red-50 border-red-200 hover:bg-red-100"
                  : "bg-green-50 border-green-200 hover:bg-green-100"
              }`}
              onClick={() => openModal(court)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{court}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isBooked
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isBooked ? "In Use" : "Available"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>Today: {courtEvents.filter(e => e.date === new Date().toISOString().split("T")[0]).length} sessions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Total events: {courtEvents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Training Session</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court">Court</Label>
                <Input
                  id="court"
                  value={selectedCourt}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={form.watch("eventType")}
                  onValueChange={(value) => form.setValue("eventType", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="e.g., Junior Training Session"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register("date")}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <TimeSelect
                  id="time"
                  value={form.watch("time") || ""}
                  onChange={(value) => form.setValue("time", value)}
                  placeholder="Select time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
                placeholder="120"
                min="30"
                max="300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach">Coach</Label>
              <Input
                id="coach"
                {...form.register("coach")}
                placeholder="Coach name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Participants (comma separated)</Label>
              <Textarea
                id="participants"
                {...form.register("participants")}
                placeholder="Player 1, Player 2, Player 3..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Additional details about the session..."
                rows={2}
              />
            </div>

            {createEventMutation.error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createEventMutation.error.error === "conflict"
                    ? "This court is already booked for the selected time. Please choose a different time slot."
                    : "Failed to schedule session. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? "Scheduling..." : "Schedule Session"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}