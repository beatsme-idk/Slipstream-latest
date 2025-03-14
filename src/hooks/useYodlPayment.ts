import { useState, useEffect } from 'react';
import { yodlService, type PaymentRequest, type PaymentResponse, FiatCurrency } from '../lib/yodlSDK';

interface UseYodlPaymentReturn {
  requestPayment: (config: PaymentRequest) => Promise<PaymentResponse>;
  isLoading: boolean;
  error: string | null;
  paymentResult: PaymentResponse | null;
  clearError: () => void;
  clearPaymentResult: () => void;
}

export function useYodlPayment(): UseYodlPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

  // Check for payment information in URL on mount
  useEffect(() => {
    const urlPaymentResult = yodlService.parsePaymentFromUrl();
    if (urlPaymentResult) {
      setPaymentResult(urlPaymentResult);
      
      // Clean the URL to prevent duplicate processing on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('txHash');
      url.searchParams.delete('chainId');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  const requestPayment = async (config: PaymentRequest): Promise<PaymentResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await yodlService.requestPayment(config);
      setPaymentResult(response);
      return response;
    } catch (error: unknown) {
      let errorMessage = 'Payment request failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearPaymentResult = () => setPaymentResult(null);

  return {
    requestPayment,
    isLoading,
    error,
    paymentResult,
    clearError,
    clearPaymentResult
  };
} 