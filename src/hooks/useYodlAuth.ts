import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { yodlSDK, parseJwtWithoutVerification } from '../lib/yodlSDK';

interface YodlUserData {
  address: string;
  ensName?: string;
  preferences?: {
    tokens: string[];
    chains: string[];
  };
}

export function useYodlAuth() {
  const { address } = useAccount();
  const [userData, setUserData] = useState<YodlUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // First, get the token from URL
  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    console.log('JWT Token from URL:', urlToken);
    setToken(urlToken);
    
    // If no token is present, set loading to false immediately
    if (!urlToken) {
      console.log('No token in URL, setting loading to false');
      setIsLoading(false);
    }
  }, []);

  // Then, use the token to fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        console.log('No token available, skipping user data fetch');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Verifying token with Yodl SDK...');
        const decodedData = await yodlSDK.verify(token);
        console.log('Decoded JWT data:', decodedData);
        
        // Extract user address from the token payload
        const userAddress = decodedData.sub || address;
        
        if (!userAddress) {
          console.error('No user address found in token or wallet');
          setError('No user address found. Please connect your wallet or login again.');
          setIsLoading(false);
          return;
        }
        
        setUserData({
          address: userAddress,
          ensName: decodedData.ens,
          preferences: {
            tokens: decodedData.tokens || ['all'],
            chains: decodedData.chains || ['all'],
          },
        });
        
        console.log('User data set successfully');
      } catch (err) {
        console.error('Failed to verify token with SDK:', err);
        
        // Try fallback method
        try {
          console.log('Attempting fallback JWT parsing...');
          const fallbackData = await parseJwtWithoutVerification(token);
          
          const userAddress = fallbackData.sub || address;
          
          setUserData({
            address: userAddress,
            ensName: fallbackData.ens,
            preferences: {
              tokens: fallbackData.tokens || ['all'],
              chains: fallbackData.chains || ['all'],
            },
          });
          
          console.log('User data set using fallback method');
        } catch (fallbackErr) {
          console.error('Fallback parsing also failed:', fallbackErr);
          setError('Failed to authenticate. Please try again.');
        }
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token, address]);

  return { userData, isLoading, error, token };
} 