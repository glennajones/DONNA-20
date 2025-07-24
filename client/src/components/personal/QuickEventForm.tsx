import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, User, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

import type { InsertEvent } from "@shared/schema";

export function QuickEventForm() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [eventData, setEventData] = useState({
    name: "",
    startDate: "",
    startTime: "",
    endTime: "",
    location: ""
  });

  // Role visibility control
  const ALL_ROLES = ['admin', 'manager', 'coach', 'staff', 'player', 'parent'];
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(['admin']); // Default to admin only

  const toggleRole = (role: string) => {
    setVisibleToRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const resetForm = () => {
    setEventData({
      name: "",
      startDate: "",
      startTime: "",
      endTime: "",
      location: ""
    });
    setVisibleToRoles(['admin']);
  };

  const handleSubmit = async () => {
    if (!eventData.name || !eventData.startDate) {
      toast({
        title: "Missing Information",
        description: "Please provide at least an event name and date.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: InsertEvent = {
        name: eventData.name,
        eventType: "Social", // Personal events are social type
        startDate: eventData.startDate,
        endDate: eventData.startDate, // Single day event
        startTime: eventData.startTime || "09:00",
        endTime: eventData.endTime || "10:00",
        location: eventData.location || "Personal",
        players: 0,
        courts: 0,
        coaches: 0,
        assignedCourts: [],
        feePerPlayer: "0.00",
        coachRates: [],
        miscExpenses: [],
        projectedRevenue: "0.00",
        actualRevenue: "0.00",
        status: "active",
        registrationFee: "0.00",
        freeForSubscribers: true,
        visibleToRoles: visibleToRoles
      };

      const response = await apiRequest("/api/events", { 
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast({
          title: "Personal Event Created",
          description: `"${eventData.name}" has been added to your calendar.`,
        });

        // Invalidate events cache to refresh calendar
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });

        resetForm();
        setIsOpen(false);
      } else {
        throw new Error("Failed to create event");
      }
    } catch (error) {
      console.error("Create personal event error:", error);
      toast({
        title: "Error",
        description: "Failed to create personal event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-[#56A0D3] hover:bg-[#4A90C2]">
          <Plus className="h-4 w-4" />
          Quick Personal Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#56A0D3]" />
            Add Personal Event
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="quick-name">Event Name *</Label>
            <Input
              id="quick-name"
              placeholder="Haircut, Dentist, Meeting..."
              value={eventData.name}
              onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quick-date">Date *</Label>
              <Input
                id="quick-date"
                type="date"
                value={eventData.startDate}
                onChange={(e) => setEventData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-location">Location</Label>
              <Input
                id="quick-location"
                placeholder="Optional"
                value={eventData.location}
                onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quick-start">Start Time</Label>
              <Input
                id="quick-start"
                type="time"
                value={eventData.startTime}
                onChange={(e) => setEventData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-end">End Time</Label>
              <Input
                id="quick-end"
                type="time"
                value={eventData.endTime}
                onChange={(e) => setEventData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Visibility Control */}
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Label className="text-sm font-medium">Who can see this event?</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={`quick-role-${role}`}
                    checked={visibleToRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <Label 
                    htmlFor={`quick-role-${role}`}
                    className="text-xs font-normal cursor-pointer capitalize"
                  >
                    {role}
                  </Label>
                </div>
              ))}
            </div>

            {visibleToRoles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {visibleToRoles.map(role => (
                  <Badge key={role} variant="outline" className="text-xs capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setVisibleToRoles(ALL_ROLES)}
              >
                All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setVisibleToRoles(['admin'])}
              >
                Admin Only
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !eventData.name || !eventData.startDate}
              className="flex-1 bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 animate-spin" />
                  Creating...
                </div>
              ) : (
                "Add Event"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}