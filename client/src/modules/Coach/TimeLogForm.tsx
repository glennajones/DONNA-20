import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus } from 'lucide-react';

interface Coach {
  id: number;
  name: string;
  specialty: string;
}

interface TimeLogFormProps {
  defaultCoachId?: number;
}

export default function TimeLogForm({ defaultCoachId }: TimeLogFormProps) {
  const [selectedCoachId, setSelectedCoachId] = useState<string>(defaultCoachId?.toString() || '');
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get coaches list for selection
  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ['/api/coaches'],
  });

  const submitTimeLog = useMutation({
    mutationFn: async (data: { coachId: number; date: string; hours: string; notes: string }) => {
      return apiRequest('/api/coach-time-logs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Reset form
      setDate('');
      setHours('');
      setNotes('');
      setSelectedCoachId(defaultCoachId?.toString() || '');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/coach-time-logs'] });
      
      toast({
        title: "Success",
        description: "Time log submitted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit time log",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoachId || !date || !hours) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitTimeLog.mutate({
      coachId: parseInt(selectedCoachId),
      date,
      hours,
      notes,
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Submit Time Log
        </CardTitle>
        <CardDescription>
          Record your working hours for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coach">Coach *</Label>
            <Select value={selectedCoachId} onValueChange={setSelectedCoachId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.name} - {coach.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked *</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              placeholder="e.g., 2.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe what you worked on..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitTimeLog.isPending}
          >
            {submitTimeLog.isPending ? (
              "Submitting..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Submit Time Log
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}