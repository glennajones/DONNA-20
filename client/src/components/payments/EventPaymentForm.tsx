import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EventPaymentFormProps {
  eventId: number;
  eventTitle: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

interface PricingInfo {
  requiresPayment: boolean;
  paymentAmount: number;
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
  eventIsFreeForSubscribers: boolean;
}

export function EventPaymentForm({ eventId, eventTitle, onPaymentSuccess, onCancel }: EventPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [checkingPricing, setCheckingPricing] = useState(true);

  // Check event pricing on component mount
  useEffect(() => {
    async function checkEventPricing() {
      try {
        setCheckingPricing(true);
        const response = await apiRequest("POST", "/api/check-event-pricing", { eventId });
        const pricing = await response.json();
        setPricingInfo(pricing);

        // If payment is required, create payment intent
        if (pricing.requiresPayment && pricing.paymentAmount > 0) {
          const paymentResponse = await apiRequest("POST", "/api/create-payment-intent", {
            eventId,
            amount: pricing.paymentAmount
          });
          const paymentData = await paymentResponse.json();
          setClientSecret(paymentData.clientSecret);
        }
      } catch (error) {
        console.error("Error checking event pricing:", error);
        toast({
          title: "Error",
          description: "Failed to check event pricing",
          variant: "destructive",
        });
      } finally {
        setCheckingPricing(false);
      }
    }

    checkEventPricing();
  }, [eventId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pricingInfo) return;

    // If no payment required, proceed directly to registration
    if (!pricingInfo.requiresPayment) {
      onPaymentSuccess();
      return;
    }

    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Payment system not ready",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "You are now registered for the event!",
        });
        onPaymentSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingPricing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="ml-3">Checking subscription status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricingInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Failed to load pricing information</p>
          <Button onClick={onCancel} className="w-full mt-4">Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Event Registration: {eventTitle}
          {pricingInfo.hasActiveSubscription && (
            <Badge variant="secondary">Subscriber</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Subscription Status */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between">
              <span className="font-medium">Subscription Status:</span>
              <Badge variant={pricingInfo.hasActiveSubscription ? "default" : "outline"}>
                {pricingInfo.subscriptionStatus || "None"}
              </Badge>
            </div>
            
            {pricingInfo.hasActiveSubscription && pricingInfo.eventIsFreeForSubscribers && (
              <p className="text-sm text-green-600 mt-2">
                ✓ This event is included in your subscription
              </p>
            )}
            
            {!pricingInfo.hasActiveSubscription && (
              <p className="text-sm text-muted-foreground mt-2">
                Consider subscribing to access free training events
              </p>
            )}
          </div>

          {/* Payment Amount */}
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Registration Fee:</span>
            <span className={pricingInfo.requiresPayment ? "text-primary" : "text-green-600"}>
              {pricingInfo.requiresPayment ? `$${pricingInfo.paymentAmount.toFixed(2)}` : "FREE"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Element (only show if payment required) */}
            {pricingInfo.requiresPayment && clientSecret && (
              <div className="border rounded-lg p-4">
                <PaymentElement />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (pricingInfo.requiresPayment && (!stripe || !elements))}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing...
                  </div>
                ) : pricingInfo.requiresPayment ? (
                  `Pay $${pricingInfo.paymentAmount.toFixed(2)} & Register`
                ) : (
                  "Register for Free"
                )}
              </Button>
            </div>
          </form>

          {/* Subscribe Option for Non-Subscribers */}
          {!pricingInfo.hasActiveSubscription && (
            <div className="p-4 rounded-lg border-2 border-dashed border-primary/20">
              <h4 className="font-medium text-primary mb-2">Want unlimited access?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Subscribe to get free access to most training events and exclusive content.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Navigate to subscription page (you'll implement this)
                  window.open('/subscribe', '_blank');
                }}
              >
                View Subscription Plans
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}