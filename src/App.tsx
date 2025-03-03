import React, { useState, useRef, useEffect } from 'react';
import { Building2, User2, FileText, Plus, Trash2, Sun, Moon, Copy, Check, Share2, CreditCard, CheckCircle2, XCircle, Send, Hand as BrandX, MessageCircle as BrandTelegram, Phone as BrandWhatsapp } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { CryptoPreferencesModal } from './components/CryptoPreferencesModal';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { useYodlAuth } from './hooks/useYodlAuth';
import { useAccount } from 'wagmi';
import { yodlPayment } from './services/yodlPayment';
import type { PaymentConfig } from '@yodlpay/yapp-sdk';
import { yodlSDK, runningInYodlIframe, getYodlUserData, getTokenFromUrl, extractUserDataFromToken } from './lib/yodlSDK';

// Direct image URL for the logo
const LOGO_URL = 'https://i.ibb.co/zTczwP3B/logo.png';

// Add these constants near the top of the file, after other constants
const TELEGRAM_LOGO_URL = 'https://i.ibb.co/JfBtX3z/telegram-icon-6896828-1280.webp';
const WHATSAPP_LOGO_URL = 'https://i.ibb.co/VWDjV6nC/70086-logo-whatsapp-computer-viber-icons-free-download-image.png';

interface Item {
  id: string;
  description: string;
  amount: string;
  displayAmount?: string;
}

interface PartyInfo {
  details: string;
}

// Add this new component at the top of the file, after imports
const Tooltip = ({ children, text, show }: { children: React.ReactNode; text: string; show: boolean }) => {
  return (
    <div className="relative group">
      {children}
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), description: '', amount: '' }
  ]);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [preferencesSet, setPreferencesSet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrValue, setQRValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [companyInfoExpanded, setCompanyInfoExpanded] = useState(true);
  const [recipientInfoExpanded, setRecipientInfoExpanded] = useState(true);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentTimestamp, setPaymentTimestamp] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const [formErrors, setFormErrors] = useState<{
    companyDetails: boolean;
    recipientDetails: boolean;
    items: { [key: string]: { description: boolean; amount: boolean } };
  }>({
    companyDetails: false,
    recipientDetails: false,
    items: {}
  });

  const contentRef = useRef<HTMLDivElement>(null);

  const [companyInfo, setCompanyInfo] = useState<PartyInfo>({
    details: ''
  });

  const [recipientInfo, setRecipientInfo] = useState<PartyInfo>({
    details: ''
  });

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const { address: walletAddress, isConnecting } = useAccount();
  const [selectedTokens, setSelectedTokens] = useState<string[]>(['all']);
  const [selectedChains, setSelectedChains] = useState<string[]>(['all']);
  const [isYodlInitialized, setIsYodlInitialized] = useState(false);
  const [yodlUserData, setYodlUserData] = useState(null);

  const currencySymbols = {
    CHF: 'CHF',
    USD: '$',
    EUR: '€',
    GBP: '£',
    THB: '฿',
    BRL: 'R$'
  };

  const [invoiceId, setInvoiceId] = useState<string>(() => uuidv4());

  const { userData, isLoading: isLoadingYodl, error, token } = useYodlAuth();

  // Add these console logs to help with debugging
  useEffect(() => {
    console.log('User Data in App:', userData);
    console.log('Loading state:', isLoadingYodl);
    console.log('Error state:', error);
    console.log('Token:', token);
  }, [userData, isLoadingYodl, error, token]);

  // URL parameter handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceData = params.get('data');
    const txHash = params.get('txHash');
    const chainId = params.get('chainId');
    const amount = params.get('amount');
    
    if (invoiceData) {
      setIsReadOnly(true);
      try {
        const decodedData = JSON.parse(decodeURIComponent(atob(invoiceData)));
        
        // If we have txHash from URL params, update the invoice data
        if (txHash && chainId && amount) {
          const timestamp = new Date().toISOString();
          decodedData.isPaid = true;
          decodedData.paidAt = timestamp;
          decodedData.txHash = txHash;
          
          // Update URL with the new invoice data
          const encodedData = btoa(encodeURIComponent(JSON.stringify(decodedData)));
          const newUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        setItems(decodedData.items || []);
        setCompanyInfo(decodedData.companyInfo || companyInfo);
        setRecipientInfo(decodedData.recipientInfo || recipientInfo);
        setSelectedCurrency(decodedData.currency || 'USD');
        
        if (decodedData.walletAddress) {
          // Don't set wallet address, but set other preferences
          setSelectedTokens(decodedData.selectedTokens || ['all']);
          setSelectedChains(decodedData.selectedChains || ['all']);
          setPreferencesSet(true);
        }
        
        if (decodedData.isPaid) {
          setIsPaid(true);
          setPaymentTimestamp(decodedData.paidAt || null);
          setTxHash(decodedData.txHash || null);
        }

        if (decodedData.invoiceId) {
          setInvoiceId(decodedData.invoiceId);
        }
      } catch (error) {
        console.error('Error parsing invoice data:', error);
      }
    }
  }, []);

  // Handle payment completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.origin === 'https://yodl.me') {
          const { type, txHash } = event.data;
          
          if (type === 'payment_complete') {
            const currentParams = new URLSearchParams(window.location.search);
            const data = currentParams.get('data');
            if (data) {
              try {
                const decodedData = JSON.parse(decodeURIComponent(atob(data)));
                const timestamp = new Date().toISOString();
                
                // Update the invoice data with payment status
                const updatedData = {
                  ...decodedData,
                  isPaid: true,
                  paidAt: timestamp,
                  txHash: txHash || ''
                };
                
                // Re-encode the updated data
                const encodedData = btoa(encodeURIComponent(JSON.stringify(updatedData)));
                const newUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
                window.history.replaceState({}, '', newUrl);

                // Update component state
                setIsPaid(true);
                setPaymentTimestamp(timestamp);
                setTxHash(txHash || null);
              } catch (error) {
                console.error('Error updating invoice data:', error);
              }
            }

            // Clear any existing timer
            if (countdownTimer) {
              clearTimeout(countdownTimer);
            }
            if (redirectTimer) {
              clearTimeout(redirectTimer);
            }
            
            // Set a timer to close the modal
            const timer = setTimeout(() => {
              setShowPaymentModal(false);
            }, 4800); // Close 200ms before the 5-second countdown ends
            
            setCountdownTimer(timer);

            // Set a timer to redirect to the payment status page
            const redirect = setTimeout(() => {
              window.location.reload();
            }, 5000); // Redirect after 5 seconds
            setRedirectTimer(redirect);
          }
        }
      } catch (error) {
        console.debug('Error processing payment message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (countdownTimer) clearTimeout(countdownTimer);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, []);

  // Update the useEffect that handles user data
  useEffect(() => {
    if (userData) {
      console.log('Setting company info with:', userData.ensName || userData.address);
      
      // Prepopulate company info with ENS name or address
      setCompanyInfo({
        details: userData.ensName || userData.address
      });

      // Set preferences from user data
      if (userData.preferences) {
        console.log('Setting tokens:', userData.preferences.tokens);
        console.log('Setting chains:', userData.preferences.chains);
        
        setSelectedTokens(userData.preferences.tokens);
        setSelectedChains(userData.preferences.chains);
        setPreferencesSet(true);
      } else {
        // Set default preferences if none found
        setSelectedTokens(['all']);
        setSelectedChains(['all']);
        setPreferencesSet(true);
      }
    }
  }, [userData]);

  // ===== YODL INTEGRATION =====
  useEffect(() => {
    async function initializeYodl() {
      console.log('Initializing Yodl integration...');
      console.log('Running in iframe:', runningInYodlIframe);
      
      try {
        // First check if we have a token in the URL
        const urlToken = new URLSearchParams(window.location.search).get('token');
        console.log('Token from URL:', urlToken ? 'Present (not showing full token)' : 'None');
        
        if (urlToken) {
          const userData = await getYodlUserData(urlToken);
          console.log('User data from token:', userData);
          
          if (userData) {
            setYodlUserData(userData);
            
            // Set company info from user data
            if (userData.ensName || userData.address) {
              console.log('Setting company info to:', userData.ensName || userData.address);
              setCompanyInfo({
                details: userData.ensName || userData.address
              });
            }
            
            // Set token preferences
            if (userData.tokens) {
              console.log('Setting tokens:', userData.tokens);
              setSelectedTokens(userData.tokens);
            }
            
            // Set chain preferences
            if (userData.chains) {
              console.log('Setting chains:', userData.chains);
              setSelectedChains(userData.chains);
            }
          }
        }
        
        setIsYodlInitialized(true);
      } catch (error) {
        console.error('Error initializing Yodl:', error);
        setIsYodlInitialized(true); // Still mark as initialized to prevent blocking the UI
      }
    }

    initializeYodl();
  }, []);
  
  // Add detailed logging for debugging
  useEffect(() => {
    console.log('Current state:', {
      companyInfo,
      selectedTokens,
      selectedChains,
      isYodlInitialized,
      yodlUserData,
      inIframe: runningInYodlIframe
    });
  }, [companyInfo, selectedTokens, selectedChains, isYodlInitialized, yodlUserData]);

  // Add this at the beginning of your App component to detect and use iframe data
  useEffect(() => {
    const detectYodlUser = async () => {
      try {
        console.log("Detecting Yodl user data...");
        
        // Check if we're in an iframe
        const inIframe = window !== window.parent;
        console.log("Running in iframe:", inIframe);
        
        // Get token from URL
        const urlToken = new URLSearchParams(window.location.search).get('token');
        console.log("Token in URL:", urlToken ? "Yes (not showing full token)" : "No");
        
        if (urlToken) {
          // Try to decode the token
          try {
            // First try with the SDK
            const decodedData = await yodlSDK.verify(urlToken);
            console.log("Decoded token with SDK:", decodedData);
            
            // Use the ENS name or address from the token
            const userIdentifier = decodedData.ens || decodedData.sub;
            if (userIdentifier) {
              console.log("Setting company info to:", userIdentifier);
              setCompanyInfo({ details: userIdentifier });
              
              // Also set payment preferences if available
              if (decodedData.tokens) setSelectedTokens(decodedData.tokens);
              if (decodedData.chains) setSelectedChains(decodedData.chains);
            }
          } catch (sdkError) {
            console.error("SDK verification failed:", sdkError);
            
            // Fallback: try basic JWT parsing
            try {
              const parts = urlToken.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log("Fallback token parsing:", payload);
                
                const userIdentifier = payload.ens || payload.sub;
                if (userIdentifier) {
                  console.log("Setting company info to (fallback):", userIdentifier);
                  setCompanyInfo({ details: userIdentifier });
                  
                  // Also set payment preferences if available
                  if (payload.tokens) setSelectedTokens(payload.tokens);
                  if (payload.chains) setSelectedChains(payload.chains);
                }
              }
            } catch (parseError) {
              console.error("Fallback parsing failed:", parseError);
            }
          }
        } else {
          console.log("No token found in URL");
        }
      } catch (error) {
        console.error("Error detecting Yodl user:", error);
      }
    };
    
    // Run the detection immediately when the component mounts
    detectYodlUser();
  }, []); // Empty dependency array so this runs once on mount

  const addItem = () => {
    if (isReadOnly) return;
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      description: '',
      amount: ''
    }]);
  };

  const removeItem = (id: string) => {
    if (isReadOnly) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Update handleShareClick to open the invoice URL directly
  const handleShareClick = () => {
    if (!preferencesSet) return;
  
    const baseUrl = window.location.origin;
  
    const invoiceData = {
      items,
      companyInfo,
      recipientInfo,
      currency: selectedCurrency,
      walletAddress,
      selectedTokens,
      selectedChains,
      isPaid: false,
      invoiceId
    };
  
    const encodedData = btoa(encodeURIComponent(JSON.stringify(invoiceData)));
    const uniqueInvoiceUrl = `${baseUrl}?data=${encodedData}`;
  
    setQRValue(uniqueInvoiceUrl);
    setShowQRModal(true);
  };

  const handlePreferencesSave = (address, tokens, chains) => {
    console.log("Saving preferences:", { address, tokens, chains });
    setWalletAddress(address);
    setSelectedTokens(tokens);
    setSelectedChains(chains);
    setPreferencesSet(true);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const getPaymentLink = () => {
    if (!preferencesSet || !walletAddress) return '';
    const total = calculateGrandTotal();
    if (total <= 0) return '';
    
    // Create redirect URL with current invoice data
    const redirectUrl = `${window.location.origin}${window.location.pathname}?data=${new URLSearchParams(window.location.search).get('data')}`;
    
    // Handle tokens
    const tokensParam = selectedTokens.includes('All') ? '' : `&tokens=${selectedTokens.join(',')}`;
    
    // Handle chains with correct prefixes
    const chainMapping: Record<string, string> = {
        'Ethereum': 'eth',
        'Arbitrum': 'arb1',
        'Base': 'base',
        'Polygon': 'pol',
        'Optimism': 'oeth'
    };

    // Map selected chains to their prefixes
    const chainPrefixes = selectedChains
        .filter(chain => chain !== 'All')
        .map(chain => chainMapping[chain])
        .filter(Boolean);

    const chainsParam = chainPrefixes.length > 0 ? `&chains=${chainPrefixes.join(',')}` : '';

    return `https://yodl.me/${walletAddress}?amount=${total}&currency=${selectedCurrency}${tokensParam}${chainsParam}&buttonText=${encodeURIComponent('Return to Invoice')}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleItemChange = (id: string, field: keyof Item, value: string) => {
    if (isReadOnly) return;
    
    let updatedValue = value;
    
    if (field === 'amount') {
      // Handle decimal input
      const sanitizedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
      const parts = sanitizedValue.split('.');
      
      // Keep only first decimal point
      if (parts.length > 2) {
        updatedValue = parts[0] + '.' + parts.slice(1).join('');
      } else {
        updatedValue = sanitizedValue;
      }
      
      // Limit to 2 decimal places
      if (parts[1]?.length > 2) {
        updatedValue = parts[0] + '.' + parts[1].slice(0, 2);
      }

      setItems(prevItems =>
        prevItems.map(item => {
          if (item.id !== id) return item;
          return { ...item, amount: updatedValue };
        })
      );
      return;
    }
    
    // Handle non-amount fields
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== id) return item;
        return { ...item, [field]: updatedValue };
      })
    );
  };

  const handlePayment = async () => {
    if (!userData?.address) return;
    
    const total = calculateGrandTotal();
    if (total <= 0) return;

    try {
      setShowPaymentModal(true);
      
      const response = await yodlPayment.requestPayment({
        recipientAddress: userData.address,
        amount: total,
        currency: selectedCurrency as PaymentConfig['currency'],
        memo: `Invoice ${invoiceId}`,
        preferences: {
          tokens: userData.preferences?.tokens || [],
          chains: userData.preferences?.chains || [],
        },
      });

      // Handle successful payment
      setIsPaid(true);
      setPaymentTimestamp(new Date().toISOString());
      setTxHash(response.txHash);
    } catch (error) {
      console.error('Payment failed:', error);
      setShowPaymentModal(false);
    }
  };

  // Add this near the top of your App component
  useEffect(() => {
    // Simple network check
    fetch('https://yodl.me/api/health')
      .then(response => {
        console.log('Yodl API health check:', response.status);
      })
      .catch(error => {
        console.error('Failed to reach Yodl API:', error);
      });
  }, []);

  // Add this near the top of your App component, after state declarations
  useEffect(() => {
    console.log('App component mounted');
    
    // Log all important state variables
    console.log({
      userData,
      isLoadingYodl,
      error,
      token,
      companyInfo,
      recipientInfo,
      items,
      selectedCurrency,
      selectedTokens,
      selectedChains,
      preferencesSet
    });
    
    // Check if we can access the Yodl API
    fetch('https://yodl.me/api/health', { mode: 'no-cors' })
      .then(() => console.log('Yodl API reachable'))
      .catch(err => console.error('Yodl API unreachable:', err));
      
    // Check if the SDK is properly initialized
    try {
      console.log('Yodl SDK initialized with:', {
        ensName: import.meta.env.VITE_YODL_ENS_NAME,
        origin: 'https://yodl.me'
      });
    } catch (err) {
      console.error('Error accessing environment variables:', err);
    }
  }, []);

  // Add this effect near the beginning of your App component
  useEffect(() => {
    // Simple, direct approach to get user data from token
    const token = getTokenFromUrl();
    
    if (token) {
      console.log('Found token in URL');
      const userData = extractUserDataFromToken(token);
      
      if (userData) {
        console.log('Extracted user data:', userData);
        
        // Set company info
        if (userData.ensName || userData.address) {
          setCompanyInfo({
            details: userData.ensName || userData.address
          });
        }
      }
    } else {
      console.log('No token found in URL');
    }
  }, []);

  // Render a loading indicator only if we're actually loading Yodl data
  if (isLoadingYodl && token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-500">Loading user data...</p>
      </div>
    );
  }

  // Main content rendering
  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
    } p-2 md:p-8`}>
      <div
        ref={contentRef}
        className={`max-w-6xl mx-auto ${
          theme === 'dark'
            ? 'bg-gray-800/90 text-gray-100 shadow-2xl shadow-gray-900/50'
            : 'bg-white/95 text-gray-900 shadow-2xl shadow-indigo-900/20'
        } backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 md:p-8 transition-all duration-200`}
      >
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="w-[88px] md:w-[120px]">
            <button
              onClick={toggleTheme}
              className={`flex w-8 h-8 md:w-10 md:h-10 rounded-xl items-center justify-center transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300 hover:text-yellow-200'
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
              } hover:scale-105`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Moon className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src={LOGO_URL} alt="Slipstream" className="w-8 h-8 md:w-10 md:h-10 drop-shadow-lg" />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Slipstream
              </h1>
            </div>
            <p className="text-sm md:text-base text-indigo-400 mt-1">
              Crypto Invoicing Simplified
            </p>
          </div>
          
          <div className="w-[88px] md:w-[120px]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className={`group transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-gray-700/50 hover:bg-gray-700/70'
              : 'bg-indigo-50/50 hover:bg-indigo-50/70'
          } rounded-2xl overflow-hidden hover:shadow-lg`}>
            <button 
              onClick={() => setCompanyInfoExpanded(!companyInfoExpanded)}
              className="w-full md:hidden flex items-center justify-between p-4"
            >
              <div className="flex items-center text-base font-semibold">
                <Building2 className={`${theme === 'dark' ? 'text-gray-300' : 'text-[#4834d4]'} w-5 h-5 mr-2`} />
                Invoice From
              </div>
              <div className={`transform transition-transform duration-200 ${
                companyInfoExpanded ? '-rotate-180' : 'rotate-0'
              }`}>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <path 
                    d="M2.5 4.5L6 8L9.5 4.5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
            <div className={`transition-all duration-300 ${
              companyInfoExpanded ? 'p-4 md:p-6' : 'h-0 md:h-auto md:p-6'
            }`}>
              <div className="hidden md:flex items-center mb-3 text-lg font-semibold">
                <Building2 className="text-[#4834d4] w-5 h-5 mr-2" />
                Invoice From
              </div>
              <textarea
                placeholder="Enter issuer details *"
                className={`w-full h-32 md:h-40 p-4 rounded-lg text-base md:text-base transition-all error-field resize-none ${
                  theme === 'dark'
                    ? isReadOnly ? 'bg-gray-800 text-gray-400' : 'bg-gray-700 border-gray-600 text-gray-100'
                    : isReadOnly ? 'bg-gray-100 text-gray-600' : 'bg-white border-[#4834d4]/20'
                } ${formErrors.companyDetails ? 'ring-2 ring-red-500' : ''}`}
                value={companyInfo.details}
                readOnly={isReadOnly}
                onFocus={() => setIsEditingCompany(true)}
                onBlur={() => setIsEditingCompany(false)}
                onChange={e => setCompanyInfo({ details: e.target.value })}
                tabIndex={1}
              />
              {formErrors.companyDetails && (
                <p className="text-red-500 text-sm mt-1">Company details are required</p>
              )}
            </div>
          </div>

          <div className={`group transition-all duration-200 ${
            theme === 'dark'
              ? 'bg-gray-700/50 hover:bg-gray-700/70'
              : 'bg-indigo-50/50 hover:bg-indigo-50/70'
          } rounded-2xl overflow-hidden hover:shadow-lg`}>
            <button 
              onClick={() => setRecipientInfoExpanded(!recipientInfoExpanded)}
              className="w-full md:hidden flex items-center justify-between p-4"
            >
              <div className="flex items-center text-base font-semibold">
                <User2 className={`${theme === 'dark' ? 'text-gray-300' : 'text-[#4834d4]'} w-5 h-5 mr-2`} />
                Invoice To
              </div>
              <div className={`transform transition-transform duration-200 ${
                recipientInfoExpanded ? '-rotate-180' : 'rotate-0'
              }`}>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <path 
                    d="M2.5 4.5L6 8L9.5 4.5" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
            <div className={`transition-all duration-300 ${
              recipientInfoExpanded ? 'p-4 md:p-6' : 'h-0 md:h-auto md:p-6'
            }`}>
              <div className="hidden md:flex items-center mb-3 text-lg font-semibold">
                <User2 className="text-[#4834d4] w-5 h-5 mr-2" />
                Invoice To
              </div>
              <textarea
                placeholder="Enter recipient details *"
                className={`w-full h-32 md:h-40 p-4 rounded-lg text-base md:text-base transition-all error-field resize-none ${
                  theme === 'dark'
                    ? isReadOnly ? 'bg-gray-800 text-gray-400' : 'bg-gray-700 border-gray-600 text-gray-100'
                    : isReadOnly ? 'bg-gray-100 text-gray-600' : 'bg-white border-[#4834d4]/20'
                } ${formErrors.recipientDetails ? 'ring-2 ring-red-500' : ''}`}
                value={recipientInfo.details}
                readOnly={isReadOnly}
                onFocus={() => setIsEditingRecipient(true)}
                onBlur={() => setIsEditingRecipient(false)}
                onChange={e => setRecipientInfo({ details: e.target.value })}
                tabIndex={2}
              />
              {formErrors.recipientDetails && (
                <p className="text-red-500 text-sm mt-1">Recipient details are required</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Items
            </div>
            {!isReadOnly && (
              <select
                className={`w-32 p-2 rounded-xl transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-gray-900'
                } border-2 border-transparent focus:border-indigo-500 outline-none`}
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                tabIndex={-1}
              >
                <option value="CHF">CHF</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="THB">THB (฿)</option>
                <option value="BRL">BRL (R$)</option>
              </select>
            )}
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="relative group">
                <div className="grid grid-cols-12 gap-2 md:gap-3">
                  <input
                    type="text"
                    placeholder="Description *"
                    className={`col-span-7 md:col-span-9 p-3 md:p-4 rounded-lg text-sm md:text-base transition-all error-field ${
                      theme === 'dark'
                        ? isReadOnly ? 'bg-gray-800 text-gray-400' : 'bg-gray-700 border-gray-600 text-gray-100'
                        : isReadOnly ? 'bg-gray-100 text-gray-600' : 'bg-white border-[#4834d4]/20'
                    } ${formErrors.items[item.id]?.description ? 'ring-2 ring-red-500' : ''}`}
                    value={item.description}
                    readOnly={isReadOnly}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    tabIndex={index === 0 ? 3 : -1}
                  />
                  <div className="col-span-5 md:col-span-3 relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm md:text-base opacity-75`}>
                      {currencySymbols[selectedCurrency as keyof typeof currencySymbols]}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      placeholder="Amount *"
                      className={`w-full pl-8 p-3 md:p-4 rounded-lg text-sm md:text-base transition-all error-field text-right ${
                        theme === 'dark'
                          ? isReadOnly ? 'bg-gray-800 text-gray-400' : 'bg-gray-700 border-gray-600 text-gray-100'
                          : isReadOnly ? 'bg-gray-100 text-gray-600' : 'bg-white border-[#4834d4]/20'
                      } ${formErrors.items[item.id]?.amount ? 'ring-2 ring-ring-500' : ''}`}
                      value={item.displayAmount || item.amount}
                      readOnly={isReadOnly}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes('.') || value.includes(',')) {
                          const sanitized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                          handleItemChange(item.id, 'amount', sanitized);
                        } else {
                          handleItemChange(item.id, 'amount', value);
                        }
                      }}
                      tabIndex={index === 0 ? 4 : -1}
                    />
                  </div>
                </div>
                {!isReadOnly && items.length > 1 && index > 0 && (
                  <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => removeItem(item.id)}
                      className={`p-1.5 rounded-full shadow-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-red-400 hover:text-red-300'
                          : 'bg-white hover:bg-red-50 text-red-400 hover:text-red-500'
                      }`}
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <button
                onClick={addItem}
                className={`w-full mt-4 p-4 rounded-lg text-base md:text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                    : 'bg-[#4834d4]/10 hover:bg-[#4834d4]/20 text-[#4834d4]'
                }`}
                tabIndex={-1}
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button> )}
          </div>
        </div>

        <div className={`mb-6 md:mb-8 p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700/50' : 'bg-[#4834d4]/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-lg md:text-lg font-semibold">Total:</span>
            <span className="text-xl md:text-xl font-bold text-[#4834d4] dark:text-white">
              {currencySymbols[selectedCurrency]}{calculateGrandTotal().toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-6">
          {!isReadOnly ? (
            <>
              <Tooltip 
                text="Fill required fields first" 
                show={!companyInfo.details || !recipientInfo.details || !items.some(item => item.description && parseFloat(item.amount) > 0)}
              >
                <button
                  onClick={() => setShowCryptoModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Set Payment Preferences
                </button>
              </Tooltip>

              <Tooltip 
                text="Set Payment Settings first" 
                show={!companyInfo.details || !recipientInfo.details || !items.some(item => item.description && parseFloat(item.amount) > 0) || !preferencesSet}
              >
                <button
                  onClick={handleShareClick}
                  disabled={!companyInfo.details || !recipientInfo.details || !items.some(item => item.description && parseFloat(item.amount) > 0) || !preferencesSet}
                  className={`w-full p-4 md:p-5 rounded-xl md:rounded-2xl text-sm md:text-base font-medium transition-all duration-300 ${
                    !companyInfo.details || !recipientInfo.details || !items.some(item => item.description && parseFloat(item.amount) > 0) || !preferencesSet
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'
                        : 'bg-[#4834d4] hover:bg-[#3c2bb3] text-white cursor-pointer'
                  }`}
                  tabIndex={6}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Generate Invoice</span>
                  </div>
                </button>
              </Tooltip>
            </>
          ) : (
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {!isPaid ? (
                <a
                  href={getPaymentLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mx-auto w-full md:min-w-[600px] p-6 rounded-2xl text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative flex items-center text-lg">
                    Pay {currencySymbols[selectedCurrency]}{calculateGrandTotal().toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} to {walletAddress}
                  </div>
                </a>
              ) : (
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 p-4 rounded-lg text-base md:text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Paid on {paymentTimestamp && formatTimestamp(paymentTimestamp)}
                  </div>

                  {txHash && (
                    <div className="flex flex-col md:flex-row gap-2">
                      <a
                        href={`https://yodl.me/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full p-4 rounded-lg text-base font-medium transition-colors flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
                      >
                        <FileText className="w-5 h-5" />
                        <span>View Receipt</span>
                      </a>

                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => {
                            const amount = `${currencySymbols[selectedCurrency]}${calculateGrandTotal().toFixed(2)}`;
                            const receiptUrl = `https://yodl.me/tx/${txHash}`;
                            const text = `I just paid ${amount} via Slipstream.`;
                            window.open(`https://t.me/share/url?url=${encodeURIComponent(receiptUrl)}&text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className={`flex-1 p-4 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                            theme === 'dark'
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
                          } md:w-[140px]`}
                        >
                          <img src={TELEGRAM_LOGO_URL} alt="Telegram" className="w-5 h-5" />
                          <span className="hidden md:inline">Telegram</span>
                        </button>

                        <button
                          onClick={() => {
                            const amount = `${currencySymbols[selectedCurrency]}${calculateGrandTotal().toFixed(2)}`;
                            const receiptUrl = `https://yodl.me/tx/${txHash}`;
                            const text = `I just paid ${amount} via Slipstream. Here's the receipt:\n${receiptUrl}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className={`flex-1 p-4 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                            theme === 'dark'
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
                          } md:w-[140px]`}
                        >
                          <img src={WHATSAPP_LOGO_URL} alt="WhatsApp" className="w-5 h-5" />
                          <span className="hidden md:inline">WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {showCryptoModal && (
          <CryptoPreferencesModal
            isOpen={showCryptoModal}
            onClose={() => setShowCryptoModal(false)}
            onSave={handlePreferencesSave}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            selectedTokens={selectedTokens}
            setSelectedTokens={setSelectedTokens}
            selectedChains={selectedChains}
            setSelectedChains={setSelectedChains}
          />
        )}

        {showPaymentModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPaymentModal(false);
              }
            }}
          >
            <div className="w-full max-w-2xl bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
              <iframe
                ref={iframeRef}
                src={getPaymentLink()}
                className="w-full h-[500px] md:h-[600px] border-0"
                allow="clipboard-write"
              />
            </div>
          </div>
        )}

        {showQRModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowQRModal(false);
              }
            }}
          >
            <div className={`w-full max-w-md ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-white'
            } rounded-3xl shadow-2xl p-8 border ${
              theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className={`text-2xl font-semibold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Share Invoice</h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>Scan or share the QR code below</p>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
                  }`}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex justify-center mb-8">
                <div className={`p-8 rounded-3xl ${
                  theme === 'dark' ? 'bg-white' : 'bg-gray-50'
                } shadow-lg border ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  <QRCodeSVG
                    value={qrValue}
                    size={240}
                    level="M"
                    includeMargin={true}
                    className="rounded-2xl"
                    style={{
                      shapeRendering: 'geometricPrecision'
                    }}
                    bgColor={theme === 'dark' ? '#FFFFFF' : '#F8FAFC'}
                    fgColor={theme === 'dark' ? '#1E293B' : '#4834d4'}
                    imageSettings={{
                      src: LOGO_URL,
                      height: 48,
                      width: 48,
                      excavate: true
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    window.open(qrValue, '_blank');
                    setShowQRModal(false);
                  }}
                  className="flex-1 p-4 rounded-2xl text-sm md:text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Open Invoice</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrValue);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`p-4 rounded-2xl min-w-[120px] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-medium flex items-center justify-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;