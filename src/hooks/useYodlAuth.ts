import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { yodlSDK } from '../lib/yodlSDK';

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
  }, []);

  // Then, use the token to fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        console.log('No token available yet');
        return;
      }

      try {
        console.log('Verifying token with Yodl SDK...');
        const decodedData = await yodlSDK.verify(token);
        console.log('Decoded JWT data:', decodedData);
        
        // Extract user address from the token payload
        const userAddress = decodedData.sub || address;
        
        setUserData({
          address: userAddress,
          ensName: decodedData.ens,
          preferences: {
            tokens: decodedData.tokens || ['all'],
            chains: decodedData.chains || ['all'],
          },
        });
        
        console.log('User data set:', {
          address: userAddress,
          ensName: decodedData.ens,
          preferences: {
            tokens: decodedData.tokens || ['all'],
            chains: decodedData.chains || ['all'],
          },
        });
      } catch (err) {
        console.error('Failed to verify token:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token, address]);

  return { userData, isLoading, error, token };
} 