import YappSDK from '@yodlpay/yapp-sdk';
import type { FiatCurrency } from '@yodlpay/yapp-sdk';

// Define our own PaymentConfig type since it's not exported from the SDK
interface PaymentConfig {
  amount: number;
  currency: FiatCurrency;
  memo?: string;
  preferences?: {
    token?: string;    // JWT token for auth
    address?: string;  // User's wallet address or ENS
  };
}

class YodlService {
  private sdk: YappSDK;

  constructor() {
    // Ensure ENS name is defined
    const ensName = process.env.NEXT_PUBLIC_YODL_ENS_NAME;
    if (!ensName) {
      throw new Error('YODL ENS name not configured');
    }

    this.sdk = new YappSDK({
      ensName,
      // Add JWT configuration if needed
      auth: {
        jwt: true,
      }
    });
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      return await this.sdk.validateToken(token);
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  async requestPayment(
    recipientAddress: string,
    config: PaymentConfig
  ): Promise<void> {
    try {
      // Include payment preferences in the request
      await this.sdk.requestPayment(recipientAddress, {
        amount: config.amount,
        currency: config.currency,
        memo: config.memo,
        preferences: config.preferences
      });
    } catch (error) {
      console.error('Payment request failed:', error);
      throw error;
    }
  }

  isInIframe(): boolean {
    return this.sdk.isInIframe();
  }

  closeApplication(): void {
    this.sdk.closeApplication();
  }
}

export const yodlService = new YodlService(); 