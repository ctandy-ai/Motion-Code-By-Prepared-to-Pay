import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, Shield } from "lucide-react";

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

function CheckoutForm({ clientSecret, onSuccess, onError, isLoading }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements || !clientSecret) {
      setError("Payment system not loaded. Please try again.");
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setProcessing(false);
      return;
    }

    try {
      // Confirm the setup intent (for subscriptions with trial)
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        onSuccess();
      } else {
        setError("Payment setup incomplete");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Payment Details
          </span>
        </div>
        <div className="border rounded-md p-3 bg-white dark:bg-gray-900">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              14-Day Free Trial
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-200">
              Your card will be saved securely but not charged until your trial expires. 
              Cancel anytime during the trial period at no cost.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing || isLoading}
        className="w-full"
        size="lg"
        data-testid="button-complete-registration"
      >
        {processing || isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Start Free Trial & Complete Registration"
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By continuing, you agree to be charged $29/month after your 14-day trial ends.
        You can cancel anytime from your account settings.
      </p>
    </form>
  );
}

export default function StripePaymentForm({ clientSecret, onSuccess, onError, isLoading }: PaymentFormProps) {
  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        isLoading={isLoading}
      />
    </Elements>
  );
}