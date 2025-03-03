import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { yodlSDK, getTokenFromUrl, extractUserDataFromToken } from '../lib/yodlSDK';

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

  // Get token from URL on hook initialization
  useEffect(() => {
    const urlToken = getTokenFromUrl();
    console.log('useYodlAuth: JWT Token from URL:', urlToken ? 'Present' : 'None');
    setToken(urlToken);
    
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
        
        // Construct user data with consistent structure
        const userDataObj = {
          address: userAddress,
          ensName: decodedData.ens,
          preferences: {
            tokens: decodedData.tokens || ['all'],
            chains: decodedData.chains || ['all'],
          },
        };
        
        console.log('Setting user data:', userDataObj);
        setUserData(userDataObj);
        
      } catch (err) {
        console.error('Failed to verify token with SDK:', err);
        
        // Try fallback method with more debugging
        try {
          console.log('Attempting fallback JWT parsing...');
          const userData = extractUserDataFromToken(token);
          
          if (userData) {
            console.log('Fallback parsing succeeded:', userData);
            const userAddress = userData.address || address;
            
            setUserData({
              address: userAddress,
              ensName: userData.ensName,
              preferences: {
                tokens: userData.tokens || ['all'],
                chains: userData.chains || ['all'],
              },
            });
            
            console.log('User data set using fallback method');
          } else {
            console.error('Fallback parsing returned null');
            setError('Failed to parse authentication token');
          }
        } catch (fallbackErr) {
          console.error('Fallback parsing failed:', fallbackErr);
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