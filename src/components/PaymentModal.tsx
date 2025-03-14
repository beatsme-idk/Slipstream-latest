import React from 'react';
import { useYodlPayment } from '../hooks/useYodlPayment';
import { FiatCurrency } from '../lib/yodlSDK';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: FiatCurrency;
  recipientAddress: string;
  memo?: string;
  preferences?: {
    tokens: string[];
    chains: string[];
  };
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  recipientAddress,
  memo,
  preferences
}) => {
  const {
    requestPayment,
    isLoading,
    error,
    paymentResult,
    clearError
  } = useYodlPayment();

  const handlePayment = async () => {
    try {
      await requestPayment({
        recipientAddress,
        amount,
        currency,
        memo,
        preferences,
        redirectUrl: window.location.href
      });
    } catch (error) {
      // Error is already handled by the hook
      console.error('Payment failed:', error);
    }
  };

  // Close modal when payment is successful
  React.useEffect(() => {
    if (paymentResult) {
      onClose();
    }
  }, [paymentResult, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="payment-modal-title"
      aria-describedby="payment-modal-description"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
          <h2 
            id="payment-modal-title" 
            className="text-xl font-bold mb-4 text-gray-900 dark:text-white"
          >
            Complete Payment
          </h2>
          
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">
              Amount: {amount} {currency}
            </p>
            {memo && (
              <p className="text-gray-600 dark:text-gray-300">
                Memo: {memo}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
              <p>{error}</p>
              <button 
                onClick={clearError}
                className="text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className={`px-4 py-2 rounded bg-blue-600 text-white ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 