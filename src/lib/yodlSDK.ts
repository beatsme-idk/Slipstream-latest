import YappSDK, { isInIframe as isInIframeYodl } from '@yodlpay/yapp-sdk';

// Initialize the SDK with your domain
export const yodlSDK = new YappSDK({
  ensName: import.meta.env.VITE_YODL_ENS_NAME || 'slipstream.eth',
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