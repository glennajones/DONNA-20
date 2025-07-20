import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Users, DollarSign, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: number;
    title: string;
    date: string;
    time: string;
    duration: number;
    court: string;
    eventType: string;
    coach?: string;
    description?: string;
  } | null;
}

export default function EventRegistrationModal({ isOpen, onClose, event }: EventRegistrationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerProfile, setPlayerProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    playerName: "",
    playerEmail: "",
    playerPhone: "",
    playerDateOfBirth: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalInfo: "",
    parentName: user?.role === "parent" ? user.name : "",
    parentEmail: user?.role === "parent" ? user.email || "" : "",
    parentPhone: user?.role === "parent" ? user.phone || "" : "",
    registrationType: user?.role === "parent" ? "parent" : "player",
  });

  // Fetch player profile data if user is a player
  useEffect(() => {
    const fetchPlayerProfile = async () => {
      if (user?.role === "player" && isOpen) {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('/api/players', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          if (response.ok) {
            const players = await response.json();
            // Find the player profile that matches the current user's name
            const currentPlayerProfile = players.find(player => 
              player.name === user.name && player.status === "active"
            );
            
            if (currentPlayerProfile) {
              setPlayerProfile(currentPlayerProfile);
              // Pre-fill form with player data
              setFormData(prev => ({
                ...prev,
                playerName: currentPlayerProfile.name || "",
                playerEmail: currentPlayerProfile.contact || "",
                playerPhone: currentPlayerProfile.phone || "",
                playerDateOfBirth: currentPlayerProfile.dateOfBirth || "",
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch player profile:', error);
        }
      }
    };

    fetchPlayerProfile();
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/event-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          eventId: event.id,
          ...formData
        })
      });

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: `You have been registered for ${event.title}. A confirmation email will be sent shortly.`
        });
        onClose();
        // Reset form
        setFormData({
          playerName: "",
          playerEmail: "",
          playerPhone: "",
          playerDateOfBirth: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          medicalInfo: "",
          parentName: user?.role === "parent" ? user.name : "",
          parentEmail: user?.role === "parent" ? user.email || "" : "",
          parentPhone: user?.role === "parent" ? user.phone || "" : "",
          registrationType: user?.role === "parent" ? "parent" : "player",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!event) return null;

  const endTime = (() => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + (event.duration || 120);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Register for Training Session</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#56A0D3]">
                <CalendarDays className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <Badge variant="outline" className="mt-1 capitalize">{event.eventType}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span>{new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{event.time} - {endTime}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{event.court}</span>
                </div>
                
                {event.coach && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{event.coach}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Registration Fee: $25.00</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Payment will be processed after registration confirmation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#56A0D3]">
                <Users className="h-5 w-5" />
                Registration Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Player Information */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-medium">Player Information</h4>
                    {playerProfile && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Information pre-filled from your active player profile</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="playerName">Player Name *</Label>
                    <Input
                      id="playerName"
                      value={formData.playerName}
                      onChange={(e) => handleInputChange("playerName", e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="playerEmail">Player Email *</Label>
                    <Input
                      id="playerEmail"
                      type="email"
                      value={formData.playerEmail}
                      onChange={(e) => handleInputChange("playerEmail", e.target.value)}
                      placeholder="player@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="playerPhone">Player Phone *</Label>
                    <Input
                      id="playerPhone"
                      type="tel"
                      value={formData.playerPhone}
                      onChange={(e) => handleInputChange("playerPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="playerDateOfBirth">Date of Birth *</Label>
                    <Input
                      id="playerDateOfBirth"
                      type="date"
                      value={formData.playerDateOfBirth}
                      onChange={(e) => handleInputChange("playerDateOfBirth", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-medium">Emergency Contact</h4>
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {/* Parent Information (if registering as parent) */}
                {user?.role === "parent" && (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-medium">Parent Information</h4>
                    </div>
                    
                    <div>
                      <Label htmlFor="parentName">Parent Name</Label>
                      <Input
                        id="parentName"
                        value={formData.parentName}
                        onChange={(e) => handleInputChange("parentName", e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => handleInputChange("parentEmail", e.target.value)}
                        placeholder="parent@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="parentPhone">Parent Phone</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) => handleInputChange("parentPhone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                )}

                {/* Medical Information */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-medium">Medical Information</h4>
                  </div>
                  
                  <div>
                    <Label htmlFor="medicalInfo">Medical Conditions/Allergies</Label>
                    <Textarea
                      id="medicalInfo"
                      value={formData.medicalInfo}
                      onChange={(e) => handleInputChange("medicalInfo", e.target.value)}
                      placeholder="Any medical conditions, allergies, or special instructions..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700 dark:text-amber-400">
                      <p className="font-medium">Please Note:</p>
                      <p>Registration is subject to approval. You will receive a confirmation email with payment instructions once your registration is processed.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#56A0D3] hover:bg-[#4a8bc2]" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registering..." : "Register for Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}