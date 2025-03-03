import YappSDK from '@yodlpay/yapp-sdk';

// Initialize the SDK with your domain and public key
export const yodlSDK = new YappSDK({
  ensName: import.meta.env.VITE_YODL_ENS_NAME,
  // Uncomment if you have a specific origin or public key
  origin: "https://yodl.me", // Make sure this is set
  // publicKey: import.meta.env.VITE_YODL_PUBLIC_KEY,
});

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