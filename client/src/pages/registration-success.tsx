import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Mail, Calendar } from "lucide-react";

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Submitted!</h1>
          <p className="mt-2 text-gray-600">
            Thank you for applying to join VolleyClub Pro
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Confirmation Email</h3>
                <p className="text-sm text-gray-500">
                  You'll receive a confirmation email with your registration details within the next few minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Review Process</h3>
                <p className="text-sm text-gray-500">
                  Our team will review your application within 1-2 business days and send you an approval email.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Welcome Package</h3>
                <p className="text-sm text-gray-500">
                  Once approved, you'll receive payment instructions and your welcome package with training schedules.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 text-center mb-4">
                Questions about your registration? Contact us at{" "}
                <a href="mailto:info@volleyclubpro.com" className="text-primary hover:underline">
                  info@volleyclubpro.com
                </a>
              </p>
              
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}