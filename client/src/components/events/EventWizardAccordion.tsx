import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, MapPin, DollarSign, User, Plus, Trash2, CheckCircle, AlertCircle, Tag, Repeat } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

import type { InsertEvent } from "@shared/schema";

interface CoachRate {
  profile: string;
  rate: number;
}

interface MiscExpense {
  item: string;
  quantity: number;
  cost: number;
}

export function EventWizardAccordion({ onComplete }: { onComplete?: () => void }) {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>(["basic"]);

  // Event type configuration with colors
  const eventTypes = [
    { value: "Practice", label: "Practice", color: "#56A0D3", description: "Regular practice sessions" },
    { value: "School Activity", label: "School Activity", color: "#10B981", description: "School-related activities" },
    { value: "Tournament", label: "Tournament", color: "#FF0000", description: "Competitive events" },
    { value: "Camp", label: "Camp", color: "#8B5CF6", description: "Multi-day training programs" },
    { value: "Team Camp", label: "Team Camp", color: "#FFA500", description: "Multi-day team training programs" },
    { value: "Social", label: "Social", color: "#EC4899", description: "Team building activities" }
  ];

  // Basic info
  const [basic, setBasic] = useState({
    name: "",
    eventType: "Practice" as const,
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  // Role visibility control
  const ALL_ROLES = ['admin', 'manager', 'coach', 'staff', 'player', 'parent'];
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(ALL_ROLES);

  // Communication settings
  const COMM_METHOD_OPTIONS = [
    { value: 'none', label: 'No Notifications' },
    { value: 'respect_user_pref', label: 'Respect User Preferences' },
    { value: 'email_only', label: 'Email Only' },
    { value: 'sms_only', label: 'SMS Only' },
    { value: 'groupme_only', label: 'GroupMe Only' },
    { value: 'all', label: 'All Channels' },
  ];
  const [commMethod, setCommMethod] = useState('none');

  // Resource planning
  const [players, setPlayers] = useState(0);
  const [playersPerCourt, setPlayersPerCourt] = useState(6);
  const [playersPerCoach, setPlayersPerCoach] = useState(12);
  const [assignedCourts, setAssignedCourts] = useState<string[]>([]);
  const [manualCoaches, setManualCoaches] = useState<number | null>(null);
  const [useManualCoaches, setUseManualCoaches] = useState(false);
  const courts = playersPerCourt > 0 ? Math.ceil(players / playersPerCourt) : 0;
  const coaches = useManualCoaches ? (manualCoaches ?? 0) : (playersPerCoach > 0 ? Math.ceil(players / playersPerCoach) : 0);

  // Available courts from the scheduling system
  const availableCourts = [
    "Court 1", "Court 2", "Court 3", "Court 4", 
    "Court 5", "Court 6", "Court 7", "Beach 1", "Beach 2"
  ];

  // Budget & Pricing
  const [feePerPlayer, setFeePerPlayer] = useState(0);
  const [coachRates, setCoachRates] = useState<CoachRate[]>([{ profile: "", rate: 0 }]);
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>([{ item: "", quantity: 1, cost: 0 }]);

  // Duplication state
  const [duplicateEvent, setDuplicateEvent] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [recurringSettings, setRecurringSettings] = useState({
    frequency: "weekly" as "weekly" | "daily" | "monthly",
    daysOfWeek: [] as string[],
    endDate: "",
    occurrences: 1,
  });

  // Calculated values
  const projectedRevenue = players * feePerPlayer;
  
  // Calculate event duration in hours
  const getEventDurationHours = () => {
    if (!basic.startTime || !basic.endTime) return 0;
    
    const startTime = new Date(`2000-01-01T${basic.startTime}`);
    const endTime = new Date(`2000-01-01T${basic.endTime}`);
    
    // Handle overnight events
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    const diffMs = endTime.getTime() - startTime.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };
  
  const eventDurationHours = getEventDurationHours();
  const totalCoachCost = coachRates.reduce((sum, coach) => sum + (coach.rate * eventDurationHours), 0);
  const totalMiscCost = miscExpenses.reduce((sum, expense) => sum + (expense.quantity * expense.cost), 0);
  const totalCosts = totalCoachCost + totalMiscCost;
  const netProfit = projectedRevenue - totalCosts;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Court selection handlers
  const toggleCourt = (court: string) => {
    setAssignedCourts(prev => 
      prev.includes(court) 
        ? prev.filter(c => c !== court)
        : [...prev, court]
    );
  };

  // Validation functions
  const isBasicComplete = Boolean(basic.name && basic.startDate && basic.eventType);
  const isResourceComplete = players > 0 && playersPerCourt > 0 && playersPerCoach > 0;
  const isBudgetComplete = feePerPlayer >= 0; // Allow $0 for free events
  const canSubmit = isBasicComplete && isResourceComplete && isBudgetComplete;

  // Helper function to generate recurring event dates
  const generateRecurringDates = () => {
    const dates = [];
    const startDate = new Date(basic.startDate);
    
    if (!duplicateEvent) {
      return [{ startDate: basic.startDate, endDate: basic.endDate || basic.startDate }];
    }

    if (recurringSettings.frequency === "weekly" && recurringSettings.daysOfWeek.length > 0) {
      const endDate = recurringSettings.endDate ? new Date(recurringSettings.endDate) : null;
      const maxOccurrences = recurringSettings.occurrences;
      let currentDate = new Date(startDate);
      let occurrenceCount = 0;

      // Find the first occurrence based on selected days
      const dayMap = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
        Thursday: 4, Friday: 5, Saturday: 6
      };

      while (occurrenceCount < maxOccurrences && (!endDate || currentDate <= endDate)) {
        const dayName = Object.keys(dayMap).find(key => dayMap[key as keyof typeof dayMap] === currentDate.getDay());
        
        if (dayName && recurringSettings.daysOfWeek.includes(dayName)) {
          // Use local date formatting to avoid timezone shifts
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          dates.push({ startDate: dateStr, endDate: dateStr });
          occurrenceCount++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (recurringSettings.frequency === "daily") {
      for (let i = 0; i < recurringSettings.occurrences; i++) {
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + i);
        // Use local date formatting to avoid timezone shifts
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        dates.push({ startDate: dateStr, endDate: dateStr });
      }
    } else if (recurringSettings.frequency === "monthly") {
      for (let i = 0; i < recurringSettings.occurrences; i++) {
        const eventDate = new Date(startDate);
        eventDate.setMonth(startDate.getMonth() + i);
        // Use local date formatting to avoid timezone shifts
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        dates.push({ startDate: dateStr, endDate: dateStr });
      }
    }

    return dates.length > 0 ? dates : [{ startDate: basic.startDate, endDate: basic.endDate || basic.startDate }];
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({
        title: "Incomplete Information",
        description: "Please fill out all required sections before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const eventDates = generateRecurringDates();
      const createdEvents = [];

      for (let i = 0; i < eventDates.length; i++) {
        const { startDate, endDate } = eventDates[i];
        const eventName = eventDates.length > 1 ? `${basic.name} #${i + 1}` : basic.name;
        
        const payload: InsertEvent = {
          name: eventName,
          eventType: basic.eventType,
          startDate: startDate,
          endDate: endDate,
          startTime: basic.startTime || "09:00",
          endTime: basic.endTime || "17:00",
          location: "Volleyball Club",
          players: players,
          courts: courts,
          coaches: coaches,
          assignedCourts: assignedCourts,
          projectedRevenue: projectedRevenue.toString(),
          actualRevenue: "0",
          status: "planning",
          feePerPlayer: feePerPlayer.toString(),
          coachRates: JSON.stringify(coachRates.filter(rate => rate.profile)),
          miscExpenses: JSON.stringify(miscExpenses.filter(expense => expense.item)),
          visibleToRoles: visibleToRoles,
          commMethodOverride: commMethod
        };

        // Extended payload for communication settings
        const extendedPayload = {
          ...payload,
          sendEmailNotifications: commMethod !== 'none' && (commMethod === 'email_only' || commMethod === 'respect_user_pref' || commMethod === 'all'),
          sendSMSNotifications: commMethod !== 'none' && (commMethod === 'sms_only' || commMethod === 'respect_user_pref' || commMethod === 'all')
        };

        await apiRequest("/api/events", {
          method: "POST",
          body: JSON.stringify(extendedPayload),
        });
        
        createdEvents.push(eventName);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      // Also invalidate calendar/schedule queries since they show the same events
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      
      toast({
        title: "Success!",
        description: `${createdEvents.length} event${createdEvents.length > 1 ? 's' : ''} created successfully`,
      });
      
      // Reset form
      setBasic({ name: "", eventType: "Practice", startDate: "", endDate: "", startTime: "", endTime: "" });
      setPlayers(0);
      setAssignedCourts([]);
      setFeePerPlayer(0);
      setCoachRates([{ profile: "", rate: 0 }]);
      setMiscExpenses([{ item: "", quantity: 1, cost: 0 }]);
      setVisibleToRoles(ALL_ROLES);
      setCommMethod('none');
      setDuplicateEvent(false);
      setRecurringSettings({
        frequency: "weekly",
        daysOfWeek: [],
        endDate: "",
        occurrences: 1,
      });
      setOpenSections(["basic"]);
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Event creation failed:", err);
      toast({
        title: "Error",
        description: "Failed to create event(s). Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for dynamic lists
  const updateCoachRate = (index: number, field: keyof CoachRate, value: string | number) => {
    const updated = [...coachRates];
    updated[index] = { ...updated[index], [field]: field === "rate" ? Number(value) : value };
    setCoachRates(updated);
  };

  const addCoachRate = () => {
    setCoachRates([...coachRates, { profile: "", rate: 0 }]);
  };

  const removeCoachRate = (index: number) => {
    if (coachRates.length > 1) {
      setCoachRates(coachRates.filter((_, i) => i !== index));
    }
  };

  const updateMiscExpense = (index: number, field: keyof MiscExpense, value: string | number) => {
    const updated = [...miscExpenses];
    updated[index] = { ...updated[index], [field]: (field === "cost" || field === "quantity") ? Number(value) : value };
    setMiscExpenses(updated);
  };

  const addMiscExpense = () => {
    setMiscExpenses([...miscExpenses, { item: "", quantity: 1, cost: 0 }]);
  };

  const removeMiscExpense = (index: number) => {
    if (miscExpenses.length > 1) {
      setMiscExpenses(miscExpenses.filter((_, i) => i !== index));
    }
  };

  const getSectionIcon = (isComplete: boolean) => {
    return isComplete ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-amber-600" />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#56A0D3]" />
              Create New Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion 
              type="multiple" 
              value={openSections} 
              onValueChange={setOpenSections}
              className="w-full"
            >
              {/* Basic Information */}
              <AccordionItem value="basic">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(isBasicComplete)}
                    <Calendar className="h-4 w-4" />
                    Basic Information
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      placeholder="Summer Tournament 2024"
                      value={basic.name}
                      onChange={(e) => setBasic({ ...basic, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type *</Label>
                    <Select value={basic.eventType} onValueChange={(value) => setBasic({ ...basic, eventType: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: type.color }}
                              ></div>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      {eventTypes.find(t => t.value === basic.eventType)?.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={basic.startDate}
                        onChange={(e) => setBasic({ ...basic, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={basic.endDate}
                        onChange={(e) => setBasic({ ...basic, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={basic.startTime}
                        onChange={(e) => setBasic({ ...basic, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={basic.endTime}
                        onChange={(e) => setBasic({ ...basic, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                </AccordionContent>
              </AccordionItem>

              {/* Resource Planning */}
              <AccordionItem value="resources">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(isResourceComplete)}
                    <Users className="h-4 w-4" />
                    Resource Planning
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="players">Expected Number of Players *</Label>
                    <Input
                      id="players"
                      type="number"
                      placeholder="24"
                      value={players}
                      onChange={(e) => setPlayers(Number(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="playersPerCourt">Players per Court *</Label>
                      <Input
                        id="playersPerCourt"
                        type="number"
                        placeholder="6"
                        value={playersPerCourt}
                        onChange={(e) => setPlayersPerCourt(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playersPerCoach">Players per Coach *</Label>
                      <Input
                        id="playersPerCoach"
                        type="number"
                        placeholder="12"
                        value={playersPerCoach}
                        onChange={(e) => setPlayersPerCoach(Number(e.target.value) || 0)}
                        disabled={useManualCoaches}
                      />
                    </div>
                  </div>

                  {/* Manual Coach Override */}
                  <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manualCoaches"
                        checked={useManualCoaches}
                        onCheckedChange={(checked) => {
                          setUseManualCoaches(!!checked);
                          if (!checked) {
                            setManualCoaches(null);
                          }
                        }}
                      />
                      <Label htmlFor="manualCoaches" className="text-sm font-medium">
                        Override coaches (for outside/school coaches)
                      </Label>
                    </div>
                    
                    {useManualCoaches && (
                      <div className="space-y-2">
                        <Label htmlFor="manualCoachesInput">Number of Club Coaches Needed</Label>
                        <Input
                          id="manualCoachesInput"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={manualCoaches ?? ""}
                          onChange={(e) => setManualCoaches(Number(e.target.value) || 0)}
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Set to 0 if using outside coaches or school coaches that the club doesn't provide
                        </p>
                      </div>
                    )}
                  </div>

                  {players > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#56A0D3]">{courts}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Courts Needed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#56A0D3]">{coaches}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Coaches Needed</div>
                      </div>
                    </div>
                  )}

                  {/* Court Assignment */}
                  <div className="space-y-3">
                    <Label>Assign Courts (Optional)</Label>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Select specific courts for this event. If none selected, courts can be assigned later.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {availableCourts.map(court => (
                        <div key={court} className="flex items-center space-x-2">
                          <Checkbox
                            id={`court-${court}`}
                            checked={assignedCourts.includes(court)}
                            onCheckedChange={() => toggleCourt(court)}
                          />
                          <Label 
                            htmlFor={`court-${court}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {court}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {assignedCourts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {assignedCourts.map(court => (
                          <Badge key={court} variant="outline" className="text-xs">
                            {court}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Budget & Pricing */}
              <AccordionItem value="budget">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(isBudgetComplete)}
                    <DollarSign className="h-4 w-4" />
                    Budget & Pricing
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="feePerPlayer">Fee per Player ($) *</Label>
                    <Input
                      id="feePerPlayer"
                      type="number"
                      placeholder="25 (enter 0 for free courts)"
                      value={feePerPlayer}
                      onChange={(e) => setFeePerPlayer(Number(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Set to $0 to offer courts for free
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Coach Rates</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCoachRate}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Coach
                      </Button>
                    </div>
                    {coachRates.map((coach, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Coach profile/type"
                          value={coach.profile}
                          onChange={(e) => updateCoachRate(index, "profile", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Hourly Rate ($)"
                          value={coach.rate}
                          onChange={(e) => updateCoachRate(index, "rate", e.target.value)}
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCoachRate(index)}
                          disabled={coachRates.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Miscellaneous Expenses</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addMiscExpense}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Expense
                      </Button>
                    </div>
                    {miscExpenses.map((expense, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Expense item"
                          value={expense.item}
                          onChange={(e) => updateMiscExpense(index, "item", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={expense.quantity}
                          onChange={(e) => updateMiscExpense(index, "quantity", e.target.value)}
                          className="w-20"
                          min="1"
                        />
                        <Input
                          type="number"
                          placeholder="Cost ($)"
                          value={expense.cost}
                          onChange={(e) => updateMiscExpense(index, "cost", e.target.value)}
                          className="w-28"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMiscExpense(index)}
                          disabled={miscExpenses.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Role Visibility Control */}
              <AccordionItem value="visibility">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <User className="h-4 w-4" />
                    Event Visibility (Personal Calendar)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <Label>Who can see this event on their personal calendar?</Label>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Select which user roles can view this event. Useful for creating role-specific personal calendar entries.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {ALL_ROLES.map(role => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role}`}
                            checked={visibleToRoles.includes(role)}
                            onCheckedChange={() => {
                              setVisibleToRoles(prev => 
                                prev.includes(role)
                                  ? prev.filter(r => r !== role)
                                  : [...prev, role]
                              );
                            }}
                          />
                          <Label 
                            htmlFor={`role-${role}`}
                            className="text-sm font-normal cursor-pointer capitalize"
                          >
                            {role}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {visibleToRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {visibleToRoles.map(role => (
                          <Badge key={role} variant="outline" className="text-xs capitalize">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleToRoles(ALL_ROLES)}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleToRoles([])}
                      >
                        Select None
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Communication Settings */}
              <AccordionItem value="communications">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Automated Communications
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Event Notifications</Label>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Automatically notify users about this event based on role visibility settings.
                      </div>
                      
                      <Select value={commMethod} onValueChange={setCommMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMM_METHOD_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="text-xs text-gray-500 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-medium mb-1">Notification Options:</p>
                        <ul className="space-y-1">
                          <li><strong>No Notifications:</strong> Create event without sending any notifications</li>
                          <li><strong>Respect User Preferences:</strong> Send via each user's preferred communication method</li>
                          <li><strong>Email Only:</strong> Send only via email regardless of user preferences</li>
                          <li><strong>SMS Only:</strong> Send only via SMS regardless of user preferences</li>
                          <li><strong>GroupMe Only:</strong> Send only via GroupMe regardless of user preferences</li>
                          <li><strong>All Channels:</strong> Send via all available communication methods</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Live Summary Sidebar */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Event Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {basic.name && (
              <div>
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Event</h4>
                <p className="font-semibold">{basic.name}</p>
                {basic.startDate && (
                  <p className="text-sm text-gray-600">{new Date(basic.startDate).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {players > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Resources</h4>
                <div className="space-y-1 text-sm">
                  <p>{players} players</p>
                  <p>{courts} courts needed</p>
                  <p>{coaches} coaches needed</p>
                  {eventDurationHours > 0 && (
                    <p>{eventDurationHours.toFixed(1)} hours</p>
                  )}
                  {assignedCourts.length > 0 && (
                    <div className="pt-1">
                      <span className="text-xs text-gray-500">Assigned courts:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {assignedCourts.map(court => (
                          <Badge key={court} variant="outline" className="text-xs">
                            {court}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Financial Summary</h4>
              
              <div className="flex justify-between text-sm">
                <span>Projected Revenue:</span>
                <span className="font-medium">${projectedRevenue.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Coach Costs:</span>
                <span className="font-medium">
                  ${totalCoachCost.toFixed(2)}
                  {eventDurationHours > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({eventDurationHours.toFixed(1)}h)
                    </span>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Other Expenses:</span>
                <span className="font-medium">${totalMiscCost.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>Net Profit:</span>
                <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  ${netProfit.toFixed(2)}
                </span>
              </div>
              
              {projectedRevenue > 0 && (
                <div className="text-xs text-gray-500">
                  {((netProfit / projectedRevenue) * 100).toFixed(1)}% margin
                </div>
              )}
            </div>

            <Separator />

            {/* Duplicate Event Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Checkbox
                id="duplicate-event"
                checked={duplicateEvent}
                onCheckedChange={(checked) => setDuplicateEvent(checked as boolean)}
              />
              <Label htmlFor="duplicate-event" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Duplicate this event?
              </Label>
            </div>

            {duplicateEvent && (
              <Dialog open={recurringModalOpen} onOpenChange={setRecurringModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Configure Recurring Events
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Recurring Events</DialogTitle>
                    <DialogDescription>
                      Set up the schedule for repeating this event automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={recurringSettings.frequency}
                        onValueChange={(value) =>
                          setRecurringSettings(prev => ({ ...prev, frequency: value as "weekly" | "daily" | "monthly" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {recurringSettings.frequency === "weekly" && (
                      <div>
                        <Label className="text-sm font-medium">Days of Week</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={recurringSettings.daysOfWeek.includes(day)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setRecurringSettings(prev => ({
                                      ...prev,
                                      daysOfWeek: [...prev.daysOfWeek, day]
                                    }));
                                  } else {
                                    setRecurringSettings(prev => ({
                                      ...prev,
                                      daysOfWeek: prev.daysOfWeek.filter(d => d !== day)
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor={day} className="text-xs cursor-pointer">
                                {day.slice(0, 3)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={recurringSettings.endDate}
                        onChange={(e) =>
                          setRecurringSettings(prev => ({ ...prev, endDate: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="occurrences">Number of Occurrences</Label>
                      <Input
                        id="occurrences"
                        type="number"
                        min="1"
                        max="52"
                        value={recurringSettings.occurrences}
                        onChange={(e) =>
                          setRecurringSettings(prev => ({ ...prev, occurrences: parseInt(e.target.value) || 1 }))
                        }
                      />
                    </div>

                    <div className="text-sm text-gray-500 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium mb-1">Example:</p>
                      <p>
                        {recurringSettings.frequency === "weekly" && recurringSettings.daysOfWeek.length > 0
                          ? `Weekly on ${recurringSettings.daysOfWeek.join(", ")} from ${basic.startTime || "10:00 AM"} to ${basic.endTime || "12:00 PM"}`
                          : `${recurringSettings.frequency.charAt(0).toUpperCase() + recurringSettings.frequency.slice(1)} from ${basic.startTime || "10:00 AM"} to ${basic.endTime || "12:00 PM"}`
                        }
                        {assignedCourts.length > 0 && ` on ${assignedCourts.join(" and ")}`}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRecurringModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setRecurringModalOpen(false)}
                      className="bg-[#56A0D3] hover:bg-[#4A90C2]"
                    >
                      Save Settings
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {isSubmitting 
                ? "Creating Event..." 
                : duplicateEvent 
                  ? `Create ${recurringSettings.occurrences} Event${recurringSettings.occurrences > 1 ? 's' : ''}` 
                  : "Create Event"
              }
            </Button>

            {!canSubmit && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Complete all required sections to create event
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}