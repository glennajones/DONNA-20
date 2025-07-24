import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EventFeedbackFormProps {
  eventId: number;
  eventName?: string;
}

interface FeedbackEligibility {
  canSubmit: boolean;
  alreadySubmitted: boolean;
  eventName: string;
}

export default function EventFeedbackForm({ eventId, eventName }: EventFeedbackFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user can submit feedback
  const { data: eligibility, isLoading: checkingEligibility } = useQuery<FeedbackEligibility>({
    queryKey: ['/api/event-feedback/can-submit', eventId],
    enabled: !!eventId
  });

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: (data: { eventId: number; rating: number; comment: string }) =>
      apiRequest(`/api/event-feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve our events.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/event-feedback/can-submit', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast({
        title: "Invalid Rating",
        description: "Please select a rating between 1 and 5 stars.",
        variant: "destructive",
      });
      return;
    }

    submitFeedback.mutate({
      eventId,
      rating,
      comment: comment.trim()
    });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isActive = starNumber <= (hoveredStar || rating);
      
      return (
        <button
          key={starNumber}
          type="button"
          onClick={() => setRating(starNumber)}
          onMouseEnter={() => setHoveredStar(starNumber)}
          onMouseLeave={() => setHoveredStar(0)}
          className={`text-2xl transition-colors duration-150 ${
            isActive ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          <Star className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
        </button>
      );
    });
  };

  if (checkingEligibility) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Checking feedback status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (eligibility?.alreadySubmitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Feedback Already Submitted</p>
              <p className="text-sm text-green-600">
                Thank you for your feedback on "{eligibility.eventName}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eligibility?.canSubmit) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-center text-amber-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Feedback Not Available</p>
              <p className="text-sm text-amber-600">
                Feedback can only be submitted after attending the event.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          Event Feedback
        </CardTitle>
        <CardDescription>
          Share your experience with "{eligibility?.eventName || eventName}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              How would you rate this event? *
            </Label>
            <div className="flex items-center space-x-1">
              {renderStars()}
              <span className="ml-2 text-sm text-gray-600">
                ({rating} star{rating !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Comments (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you thought about the event, what went well, or how we can improve..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitFeedback.isPending || !rating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitFeedback.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}