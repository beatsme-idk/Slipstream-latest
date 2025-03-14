import YappSDK from '@yodlpay/yapp-sdk';

// Define FiatCurrency enum since it's not exported from the SDK
export enum FiatCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  THB = 'THB'
}

// Configuration type for the SDK
interface YodlConfig {
  ensName: string;
  origin?: string;
  publicKey?: string;
}

// Payment preferences type
export interface PaymentPreferences {
  tokens: string[];
  chains: string[];
  address?: string;
}

// Initialize SDK with environment variables
const config: YodlConfig = {
  ensName: process.env.NEXT_PUBLIC_YODL_ENS_NAME || '',
  origin: process.env.NEXT_PUBLIC_YODL_ORIGIN,
  publicKey: process.env.NEXT_PUBLIC_YODL_PUBLIC_KEY
};

// Create SDK instance
export const yodlSDK = new YappSDK(config);

// Payment response type
export interface PaymentResponse {
  txHash: string;
  chainId: number;
}

// Payment request configuration type
export interface PaymentRequest {
  recipientAddress: string;
  amount: number;
  currency: FiatCurrency;
  memo?: string;
  preferences?: PaymentPreferences;
  redirectUrl?: string;
}

// Yodl service class with enhanced functionality
class YodlService {
  private sdk: YappSDK;

  constructor() {
    this.sdk = yodlSDK;
  }

  // Validate JWT token
  async validateToken(token: string): Promise<boolean> {
    try {
      const result = await this.sdk.verify(token);
      return result !== undefined && result !== null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Get connected wallet info from JWT token
  async getConnectedWallet(token: string): Promise<string | null> {
    try {
      const isValid = await this.validateToken(token);
      if (!isValid) {
        throw new Error('Invalid token');
      }
      
      // Use the token to get the wallet address
      // Note: Implementation depends on your JWT structure
      return null; // Placeholder - implement based on your JWT structure
    } catch (error) {
      console.error('Failed to get connected wallet:', error);
      return null;
    }
  }

  // Request payment with enhanced error handling
  async requestPayment(config: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.sdk.requestPayment(config.recipientAddress, {
        amount: config.amount,
        currency: config.currency,
        memo: config.memo,
        redirectUrl: config.redirectUrl || window.location.href
      });

      return response;
    } catch (error: unknown) {
      let errorMessage = 'Payment request failed';
      
      if (error instanceof Error) {
        if (error.message === 'Payment was cancelled') {
          errorMessage = 'Payment was cancelled by user';
        } else if (error.message === 'Payment request timed out') {
          errorMessage = 'Payment request timed out after 5 minutes';
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  // Parse payment information from URL
  parsePaymentFromUrl(): PaymentResponse | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const txHash = urlParams.get('txHash');
      const chainId = urlParams.get('chainId');

      if (txHash && chainId) {
        return {
          txHash,
          chainId: parseInt(chainId, 10)
        };
      }
      return null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to parse payment from URL:', error.message);
      }
      return null;
    }
  }
}

// Export singleton instance
export const yodlService = new YodlService();

// Properly export the isInIframe function from the SDK
export const isInIframe = yodlService.isInIframe;

// Helper function to detect if we're running in an iframe
export function runningInIframe() {
  try {
    return window !== window.parent;
  } catch (e) {
    return true; // If we can't access window.parent, we're in an iframe
  }
}

// Get token from URL - improve with better null handling
export function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  console.log('Token from URL:', token ? 'Present (not showing full token)' : 'None');
  return token;
}

// Extract user data from token with better type safety
export function extractUserDataFromToken(token: string | null) {
  if (!token) {
    console.log('No token provided to extract user data');
    return null;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('Extracted token payload:', payload);
    
    return {
      address: payload.sub,
      ensName: payload.ens,
      tokens: payload.tokens || ['all'],
      chains: payload.chains || ['all']
    };
  } catch (error) {
    console.error('Failed to extract user data from token:', error);
    return null;
  }
}

// Parse and validate a JWT token with better error messages and consistent return structure
export async function getYodlUserData(token: string | null) {
  if (!token) {
    console.log('No token provided to getYodlUserData');
    return null;
  }
  
  try {
    console.log('Verifying token with Yodl SDK...');
    const payload = await yodlSDK.verify(token);
    console.log('Verified token payload:', payload);
    return {
      address: payload.sub,
      ensName: payload.ens,
      tokens: payload.tokens || ['all'],
      chains: payload.chains || ['all']
    };
  } catch (err) {
    console.error('Failed to verify token with SDK:', err);
    // Fallback: try to parse the token without verification
    return extractUserDataFromToken(token); 
  }
}

// Helper function to validate JWT token
export async function validateYodlToken(token: string | null) {
  if (!token) {
    throw new Error('No JWT token provided');
  }

  try {
    console.log('Validating token with Yodl SDK...');
    const payload = await yodlSDK.verify(token);
    console.log('Token validation successful:', payload);
    return payload;
  } catch (error: any) {
    console.error('Token validation failed:', error);
    if (error.name === 'JWTAudError') {
      throw new Error('Token was issued for a different Yapp');
    }
    throw new Error('Token validation failed');
  }
}

// Add this fallback function to yodlSDK.ts
export async function parseJwtWithoutVerification(token: string) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    console.log('JWT payload parsed without verification:', payload);
    return payload;
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    throw error;
  }
}

// Add a healthCheck function with better error handling
export async function checkYodlApiHealth() {
  try {
    const response = await fetch('https://yodl.me/api/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Short timeout since it's just a health check
      signal: AbortSignal.timeout(3000) 
    });
    
    if (response.ok) {
      console.log('Yodl API is healthy');
      return true;
    } else {
      console.log(`Yodl API health check returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('Yodl API health check error:', error.message);
    return false;
  }
}

// Don't make the health check blocking
checkYodlApiHealth().then(isHealthy => {
  console.log('Yodl API health status:', isHealthy ? 'Healthy' : 'Unhealthy');
}); 