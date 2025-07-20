import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, MapPin, DollarSign, User, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertEvent } from "@shared/schema";

interface CoachRate {
  profile: string;
  rate: number;
}

interface MiscExpense {
  item: string;
  cost: number;
}

export function EventWizardAccordion({ onComplete }: { onComplete?: () => void }) {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>(["basic"]);

  // Basic info
  const [basic, setBasic] = useState({
    name: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  // Resource planning
  const [players, setPlayers] = useState(0);
  const [playersPerCourt, setPlayersPerCourt] = useState(6);
  const [playersPerCoach, setPlayersPerCoach] = useState(12);
  const courts = playersPerCourt > 0 ? Math.ceil(players / playersPerCourt) : 0;
  const coaches = playersPerCoach > 0 ? Math.ceil(players / playersPerCoach) : 0;

  // Budget & Pricing
  const [feePerPlayer, setFeePerPlayer] = useState(0);
  const [coachRates, setCoachRates] = useState<CoachRate[]>([{ profile: "", rate: 0 }]);
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>([{ item: "", cost: 0 }]);

  // Calculated values
  const projectedRevenue = players * feePerPlayer;
  const totalCoachCost = coachRates.reduce((sum, coach) => sum + coach.rate, 0);
  const totalMiscCost = miscExpenses.reduce((sum, expense) => sum + expense.cost, 0);
  const totalCosts = totalCoachCost + totalMiscCost;
  const netProfit = projectedRevenue - totalCosts;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const isBasicComplete = basic.name && basic.startDate && basic.location;
  const isResourceComplete = players > 0 && playersPerCourt > 0 && playersPerCoach > 0;
  const isBudgetComplete = feePerPlayer > 0;
  const canSubmit = isBasicComplete && isResourceComplete && isBudgetComplete;

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
      
      const payload: InsertEvent = {
        ...basic,
        players,
        courts,
        coaches,
        feePerPlayer: feePerPlayer.toString(),
        coachRates,
        miscExpenses,
        projectedRevenue: projectedRevenue.toString(),
        status: "planning"
      };

      await apiRequest("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: "Success!",
        description: "Event has been created successfully",
      });
      
      // Reset form
      setBasic({ name: "", startDate: "", endDate: "", startTime: "", endTime: "", location: "" });
      setPlayers(0);
      setFeePerPlayer(0);
      setCoachRates([{ profile: "", rate: 0 }]);
      setMiscExpenses([{ item: "", cost: 0 }]);
      setOpenSections(["basic"]);
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Event creation failed:", err);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
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
    updated[index] = { ...updated[index], [field]: field === "cost" ? Number(value) : value };
    setMiscExpenses(updated);
  };

  const addMiscExpense = () => {
    setMiscExpenses([...miscExpenses, { item: "", cost: 0 }]);
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="Sports Complex, Main Gym"
                      value={basic.location}
                      onChange={(e) => setBasic({ ...basic, location: e.target.value })}
                    />
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
                      />
                    </div>
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
                      placeholder="25"
                      value={feePerPlayer}
                      onChange={(e) => setFeePerPlayer(Number(e.target.value) || 0)}
                    />
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
                          placeholder="Rate ($)"
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
                          placeholder="Cost ($)"
                          value={expense.cost}
                          onChange={(e) => updateMiscExpense(index, "cost", e.target.value)}
                          className="w-32"
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
                <span className="font-medium">${totalCoachCost.toFixed(2)}</span>
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

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {isSubmitting ? "Creating Event..." : "Create Event"}
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