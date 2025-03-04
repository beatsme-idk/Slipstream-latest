import { useEffect, useState } from 'react';
import { publicClient } from '../lib/wagmiConfig';

interface YodlPreferences {
  address: string;
  ensName?: string;
  tokens: string[];
  chains: string[];
}

/**
 * Hook to fetch Yodl payment preferences for a given address or ENS name
 * @param addressOrEns The address or ENS name to fetch preferences for
 * @returns Object containing the preferences and loading state
 */
function useYodlPreferences(addressOrEns: string) {
  const [preferences, setPreferences] = useState<YodlPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      if (!addressOrEns) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`Fetching preferences for ${addressOrEns}...`);

        // Resolve ENS name if needed
        let resolvedAddress = addressOrEns;
        if (addressOrEns.endsWith('.eth')) {
          try {
            const address = await publicClient.getEnsAddress({
              name: addressOrEns,
            });
            if (address) {
              resolvedAddress = address;
              console.log(`Resolved ${addressOrEns} to ${resolvedAddress}`);
            }
          } catch (ensError) {
            console.error('Error resolving ENS name:', ensError);
          }
        }

        // Fetch preferences from Yodl API
        const apiUrl = `${import.meta.env.VITE_YODL_API_URL || 'https://api.yodl.me'}/preferences/${resolvedAddress}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch preferences: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched preferences:', data);
        
        // Transform the data into our expected format
        setPreferences({
          address: resolvedAddress,
          ensName: addressOrEns.endsWith('.eth') ? addressOrEns : undefined,
          tokens: data.tokens || ['all'],
          chains: data.chains || ['all'],
        });
        
      } catch (err) {
        console.error('Error fetching Yodl preferences:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, [addressOrEns]);

  return { preferences, isLoading, error };
}

export default useYodlPreferences; 