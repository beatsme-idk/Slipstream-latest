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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        // Get the JWT token from the URL
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
          setError('No JWT token found in the URL');
          setIsLoading(false);
          return;
        }

        const decodedData = await yodlSDK.verify(token);

        // Set user data
        setUserData({
          address,
          ensName: decodedData.ens,
          preferences: {
            tokens: decodedData.tokens || ['all'],
            chains: decodedData.chains || ['all'],
          },
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [address]);

  return { userData, isLoading, error };
} 