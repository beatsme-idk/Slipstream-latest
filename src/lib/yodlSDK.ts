import YappSDK from '@yodlpay/yapp-sdk';

// Initialize the SDK with your domain and public key
export const yodlSDK = new YappSDK({
  ensName: import.meta.env.VITE_YODL_ENS_NAME,
  // Uncomment if you have a specific origin or public key
  // origin: import.meta.env.VITE_YODL_ORIGIN,
  // publicKey: import.meta.env.VITE_YODL_PUBLIC_KEY,
});

// Helper function to validate JWT token
export async function validateYodlToken(token: string | null) {
  if (!token) {
    throw new Error('No JWT token provided');
  }

  try {
    const payload = await yodlSDK.verify(token);
    return payload;
  } catch (error: any) {
    if (error.name === 'JWTAudError') {
      throw new Error('Token was issued for a different Yapp');
    }
    throw new Error('Token validation failed');
  }
} 