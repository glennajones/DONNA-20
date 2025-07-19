import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, MapPin, DollarSign, User, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InsertEvent } from "@shared/schema";

interface CoachRate {
  profile: string;
  rate: number;
}

interface MiscExpense {
  item: string;
  cost: number;
}

export function EventWizard({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  // STEP 1: Basic info
  const [basic, setBasic] = useState({
    name: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  // STEP 2: Court & Coach Estimation
  const [players, setPlayers] = useState(0);
  const [playersPerCourt, setPlayersPerCourt] = useState(6);
  const [playersPerCoach, setPlayersPerCoach] = useState(12);
  const courts = (players > 0 && playersPerCourt > 0) ? Math.ceil(players / playersPerCourt) : 0;
  const coaches = (players > 0 && playersPerCoach > 0) ? Math.ceil(players / playersPerCoach) : 0;

  // STEP 3: Budget & Pricing
  const [feePerPlayer, setFeePerPlayer] = useState(0);
  const [coachRates, setCoachRates] = useState<CoachRate[]>([{ profile: "", rate: 0 }]);
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>([{ item: "", cost: 0 }]);
  const projectedRevenue = players * feePerPlayer;

  // STEP 4: Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
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
      
      toast({
        title: "Success!",
        description: "Event has been created successfully",
      });
      
      // Reset form
      setStep(1);
      setBasic({ name: "", startDate: "", endDate: "", location: "" });
      setPlayers(0);
      setFeePerPlayer(0);
      setCoachRates([{ profile: "", rate: 0 }]);
      setMiscExpenses([{ item: "", cost: 0 }]);
      
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

  const totalCoachCost = coachRates.reduce((sum, rate) => sum + (rate.rate * coaches), 0);
  const totalMiscCost = miscExpenses.reduce((sum, expense) => sum + expense.cost, 0);
  const totalCosts = totalCoachCost + totalMiscCost;
  const netProfit = projectedRevenue - totalCosts;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#56A0D3]" />
          Event Wizard - Step {step} of 4
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                placeholder="Summer Tournament 2024"
                value={basic.name}
                onChange={(e) => setBasic({ ...basic, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Sports Complex, Main Gym"
                value={basic.location}
                onChange={(e) => setBasic({ ...basic, location: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="players">Expected Number of Players</Label>
              <Input
                id="players"
                type="number"
                placeholder="24"
                value={players || ""}
                onChange={(e) => setPlayers(Number(e.target.value))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playersPerCourt">Players per Court Ratio</Label>
                <Input
                  id="playersPerCourt"
                  type="number"
                  placeholder="6"
                  value={playersPerCourt}
                  onChange={(e) => setPlayersPerCourt(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playersPerCoach">Players per Coach Ratio</Label>
                <Input
                  id="playersPerCoach"
                  type="number"
                  placeholder="12"
                  value={playersPerCoach}
                  onChange={(e) => setPlayersPerCoach(Number(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#56A0D3]">{courts}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Courts</div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#56A0D3]">{coaches}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Coaches</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fee">Fee per Player ($)</Label>
              <Input
                id="fee"
                type="number"
                placeholder="50"
                value={feePerPlayer || ""}
                onChange={(e) => setFeePerPlayer(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Coach Rates</Label>
                <Button onClick={addCoachRate} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Coach Rate
                </Button>
              </div>
              {coachRates.map((rate, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Profile (e.g., Head Coach)"
                    value={rate.profile}
                    onChange={(e) => updateCoachRate(index, "profile", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Rate per hour"
                    className="w-32"
                    value={rate.rate || ""}
                    onChange={(e) => updateCoachRate(index, "rate", e.target.value)}
                  />
                  <Button
                    onClick={() => removeCoachRate(index)}
                    variant="outline"
                    size="sm"
                    disabled={coachRates.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Miscellaneous Expenses</Label>
                <Button onClick={addMiscExpense} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Expense
                </Button>
              </div>
              {miscExpenses.map((expense, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Item (e.g., Equipment rental)"
                    value={expense.item}
                    onChange={(e) => updateMiscExpense(index, "item", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Cost"
                    className="w-32"
                    value={expense.cost || ""}
                    onChange={(e) => updateMiscExpense(index, "cost", e.target.value)}
                  />
                  <Button
                    onClick={() => removeMiscExpense(index)}
                    variant="outline"
                    size="sm"
                    disabled={miscExpenses.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Projected Revenue:</span>
                    <span className="font-semibold text-green-600">${projectedRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Costs:</span>
                    <span className="font-semibold text-red-600">${totalCosts}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Profit:</span>
                    <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      ${netProfit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{basic.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dates:</span>
                    <span className="font-medium">{basic.startDate} to {basic.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="font-medium">{basic.location}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Players:</span>
                    <span className="font-medium">{players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Courts:</span>
                    <span className="font-medium">{courts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Coaches:</span>
                    <span className="font-medium">{coaches}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Fee per Player:</span>
                    <span>${feePerPlayer}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Projected Revenue:</span>
                    <span className="text-green-600">${projectedRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Costs:</span>
                    <span className="text-red-600">${totalCosts}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Net Profit:</span>
                    <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      ${netProfit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!basic.name.trim() || !basic.startDate.trim() || !basic.endDate.trim() || !basic.location.trim())) ||
                (step === 2 && players <= 0)
              }
              className="bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#56A0D3] hover:bg-[#4A90C2]"
            >
              {isSubmitting ? "Creating Event..." : "Create Event"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}