import { useState, useEffect } from 'react';
import { getTokenFromUrl, getYodlUserData } from '../lib/yodlSDK';

interface YodlUserData {
  address: string;
  ensName?: string;
  tokens: string[];
  chains: string[];
}

export function useYodlUser() {
  const [userData, setUserData] = useState<YodlUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const token = getTokenFromUrl();
        if (!token) {
          setError('No Yodl token found');
          setIsLoading(false);
          return;
        }

        const data = await getYodlUserData(token);
        if (!data) {
          setError('Failed to fetch user data');
          setIsLoading(false);
          return;
        }

        setUserData(data);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  return {
    userData,
    isLoading,
    error,
    isConnected: !!userData
  };
} 