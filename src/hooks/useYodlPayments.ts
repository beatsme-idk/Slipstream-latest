import { useState } from 'react';
import { yodlSDK } from '@/lib/yodlSDK';
import { FiatCurrency } from '@yodlpay/yapp-sdk';

interface PaymentConfig {
  amount: number;
  currency: FiatCurrency;
  memo?: string;
}

export function useYodlPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPayment = async (recipientAddress: string, config: PaymentConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await yodlSDK.requestPayment(recipientAddress, {
        amount: config.amount,
        currency: config.currency,
        memo: config.memo,
      });

      return response;
    } catch (err: any) {
      let errorMessage = 'Payment failed';
      
      if (err.message === 'Payment was cancelled') {
        errorMessage = 'Payment was cancelled by user';
      } else if (err.message === 'Payment request timed out') {
        errorMessage = 'Payment request timed out';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestPayment,
    isLoading,
    error,
  };
} 