import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QuickAddEventFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialTime?: string;
}

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "coach", label: "Coach" },
  { value: "staff", label: "Staff" },
  { value: "player", label: "Player" },
  { value: "parent", label: "Parent" }
];

const RECURRING_PATTERNS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" }
];

export function QuickAddEventForm({ isOpen, onOpenChange, initialDate, initialTime }: QuickAddEventFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    startDate: initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    startTime: initialTime || "09:00",
    endTime: initialTime || "10:00",
    location: "",
    description: "",
    visibleToRoles: [] as string[],
    visibleToUsers: [] as string[],
    isRecurring: false,
    recurringPattern: "weekly" as string,
    recurringEndDate: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location.trim() || null,
        description: formData.description.trim() || null,
        visibleToRoles: formData.visibleToRoles,
        visibleToUsers: formData.visibleToUsers,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : null,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate 
          ? new Date(formData.recurringEndDate).toISOString() 
          : null,
        color: "#4B0082"
      };

      await apiRequest("/api/simple-events", {
        method: "POST",
        body: JSON.stringify(eventData)
      });

      toast({
        title: "Success",
        description: "Personal event created successfully"
      });

      // Reset form
      setFormData({
        title: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        description: "",
        visibleToRoles: [],
        visibleToUsers: [],
        isRecurring: false,
        recurringPattern: "weekly",
        recurringEndDate: ""
      });

      // Invalidate queries to refresh calendar
      queryClient.invalidateQueries({ queryKey: ["/api/simple-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to create simple event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      visibleToRoles: prev.visibleToRoles.includes(role)
        ? prev.visibleToRoles.filter(r => r !== role)
        : [...prev.visibleToRoles, role]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Personal Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Haircut, Phone call with Michelle, Signing Day for Eli"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Hair salon, Office, Home"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {/* Visibility Controls */}
          <div className="space-y-3">
            <Label>Visibility Settings</Label>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Who can see this event? (You can always see your own events)
              </p>
              
              {/* Role-based visibility */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Visible to Roles:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.value}`}
                        checked={formData.visibleToRoles.includes(role.value)}
                        onCheckedChange={() => handleRoleToggle(role.value)}
                      />
                      <Label htmlFor={`role-${role.value}`} className="text-sm">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick role selections */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    visibleToRoles: ["admin", "manager", "staff"] 
                  }))}
                >
                  Admin & Staff
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    visibleToRoles: ROLES.map(r => r.value) 
                  }))}
                >
                  Everyone
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    visibleToRoles: [] 
                  }))}
                >
                  Private
                </Button>
              </div>
            </div>
          </div>

          {/* Recurring Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isRecurring: !!checked }))
                }
              />
              <Label htmlFor="isRecurring">Recurring Event</Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="recurringPattern">Repeat Pattern</Label>
                  <Select
                    value={formData.recurringPattern}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, recurringPattern: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRING_PATTERNS.map((pattern) => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurringEndDate">End Date</Label>
                  <Input
                    id="recurringEndDate"
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))
                    }
                    min={formData.startDate}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}