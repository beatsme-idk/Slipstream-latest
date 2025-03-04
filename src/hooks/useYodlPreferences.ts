import { useState, useEffect } from 'react';

interface YodlPreferences {
  tokens?: string[];
  chains?: string[];
  ensName?: string;
  address?: string;
}

/**
 * Hook to fetch preferences for a specific Yodl address
 * @param ensNameOrAddress - The ENS name or Ethereum address to fetch preferences for
 * @returns Object containing the preferences and loading state
 */
const useYodlPreferences = (ensNameOrAddress: string) => {
  const [preferences, setPreferences] = useState<YodlPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!ensNameOrAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Simulate API call - in production you would fetch from the Yodl API
        // Example: const response = await fetch(`https://api.yodl.me/preferences/${ensNameOrAddress}`);
        
        // For now, return mock data based on the address
        const mockData: Record<string, YodlPreferences> = {
          'maradona.yodl.eth': {
            tokens: ['USDT', 'USDC', 'ETH'],
            chains: ['Ethereum', 'Arbitrum', 'Base'],
            ensName: 'maradona.yodl.eth',
            address: '0x1234567890abcdef1234567890abcdef12345678'
          },
          'tam.yodl.eth': {
            tokens: ['USDC', 'DAI', 'ETH'],
            chains: ['Ethereum', 'Polygon', 'Optimism'],
            ensName: 'tam.yodl.eth',
            address: '0xabcdef1234567890abcdef1234567890abcdef12'
          }
        };

        // Wait a bit to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const data = mockData[ensNameOrAddress] || {
          tokens: ['ETH'],
          chains: ['Ethereum'],
          address: ensNameOrAddress
        };
        
        setPreferences(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Yodl preferences:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch preferences'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [ensNameOrAddress]);

  return { preferences, isLoading, error };
};

export default useYodlPreferences; 