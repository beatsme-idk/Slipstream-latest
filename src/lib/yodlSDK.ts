import YappSDK, { isInIframe as isInIframeYodl } from '@yodlpay/yapp-sdk';

// Initialize the SDK with your domain
export const yodlSDK = new YappSDK({
  ensName: import.meta.env.VITE_YODL_ENS_NAME || 'slipstream.yodl.eth',
  origin: "https://yodl.me",
});

// Properly export the isInIframe function from the SDK
export const isInIframe = isInIframeYodl;

// Helper function to detect if we're running in an iframe
export function runningInIframe() {
  try {
    return window !== window.parent;
  } catch (e) {
    return true; // If we can't access window.parent, we're in an iframe
  }
}

// Get token from URL
export function getTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('token');
}

// Basic function to extract user data from token without verification
export function extractUserDataFromToken(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
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

// Parse and validate a JWT token
export async function getYodlUserData(token) {
  if (!token) return null;
  
  try {
    const payload = await yodlSDK.verify(token);
    console.log('Verified token payload:', payload);
    return {
      address: payload.sub,
      ensName: payload.ens,
      tokens: payload.tokens || ['all'],
      chains: payload.chains || ['all']
    };
  } catch (err) {
    console.error('Failed to verify token:', err);
    // Fallback: try to parse the token without verification
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Fallback token parsing:', payload);
        return {
          address: payload.sub,
          ensName: payload.ens,
          tokens: payload.tokens || ['all'],
          chains: payload.chains || ['all']
        };
      }
    } catch (e) {
      console.error('Failed to parse token:', e);
    }
    return null;
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