import { yodlSDK } from '../lib/yodlSDK';
import type { PaymentConfig } from '@yodlpay/yapp-sdk';

interface PaymentRequest {
  recipientAddress: string;
  amount: number;
  currency: PaymentConfig['currency'];
  memo?: string;
  preferences?: {
    tokens?: string[];
    chains?: string[];
  };
}

export const yodlPayment = {
  async requestPayment(config: PaymentRequest) {
    try {
      const response = await yodlSDK.requestPayment(config.recipientAddress, {
        amount: config.amount,
        currency: config.currency,
        memo: config.memo,
        preferences: {
          tokens: config.preferences?.tokens,
          chains: config.preferences?.chains
        }
      });

      return response;
    } catch (error) {
      console.error('Payment request failed:', error);
      throw new Error('Payment request failed. Please try again later.'); // More user-friendly error
    }
  },

  async getPaymentStatus(txHash: string) {
    try {
      return await yodlSDK.getPaymentStatus(txHash);
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }
}; 