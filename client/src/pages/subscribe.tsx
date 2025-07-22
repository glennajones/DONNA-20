import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star } from 'lucide-react';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Successful",
        description: "Welcome to VolleyClub Pro! You now have access to all subscriber benefits.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements}
        className="w-full h-12 text-lg"
      >
        Subscribe Now
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create subscription intent
    setLoading(true);
    apiRequest("POST", "/api/get-or-create-subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Already subscribed") {
          // User is already subscribed
          setClientSecret("");
        } else {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((error) => {
        console.error("Subscription error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join VolleyClub Pro
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get unlimited access to training events, exclusive content, and premium features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Subscription Benefits */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Subscription Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Free Training Events</p>
                    <p className="text-sm text-muted-foreground">
                      Access to all regular practice sessions and skill development events
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Priority Registration</p>
                    <p className="text-sm text-muted-foreground">
                      Get first access to limited-capacity events and special workshops
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Exclusive Content</p>
                    <p className="text-sm text-muted-foreground">
                      Access to coaching resources, technique videos, and strategy guides
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Performance Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics and progress reports for skill development
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Community Access</p>
                    <p className="text-sm text-muted-foreground">
                      Direct communication with coaches and exclusive team updates
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">$29.99</span>
                  <Badge variant="secondary">per month</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cancel anytime. No long-term commitment required.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              ) : (
                <div className="text-center p-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">You're Already Subscribed!</h3>
                  <p className="text-muted-foreground mb-4">
                    You have an active VolleyClub Pro subscription with access to all benefits.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Pricing Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Event Pricing Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">Training Events</h4>
                <p className="text-sm text-muted-foreground">
                  Regular practice sessions, skill development, and team training are <strong>FREE</strong> for subscribers
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className="font-medium mb-2">Premium Events</h4>
                <p className="text-sm text-muted-foreground">
                  Tournaments, camps, and special workshops may require additional fees for all participants
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">$</Badge>
                </div>
                <h4 className="font-medium mb-2">Drop-in Events</h4>
                <p className="text-sm text-muted-foreground">
                  Non-subscribers can participate in any event by paying the individual event fee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}