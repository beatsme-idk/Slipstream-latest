import React, { useEffect } from 'react';

// Add this interface to define the props types
interface CryptoPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentLink: string) => void;
    walletAddress: string;
    setWalletAddress: (address: string) => void;
    selectedTokens: string[];
    setSelectedTokens: (tokens: string[]) => void;
    selectedChains: string[];
    setSelectedChains: (chains: string[]) => void;
}

// Update the component to use the defined props type
export const CryptoPreferencesModal: React.FC<CryptoPreferencesModalProps> = ({
    isOpen,
    onClose,
    onSave,
    walletAddress,
    setWalletAddress,
    selectedTokens,
    setSelectedTokens,
    selectedChains,
    setSelectedChains
}) => {
    if (!isOpen) return null;
  
    const AVAILABLE_TOKENS = ['All', 'USDC', 'USDT', 'USDGLO', 'USDM', 'DAI', 'CRVUSD'];
    const AVAILABLE_CHAINS = ['All', 'Ethereum', 'Arbitrum', 'Optimism', 'Base', 'Polygon'];
  
    // Initialize with 'All' if nothing is selected
    useEffect(() => {
      if (selectedTokens.length === 0 || !selectedTokens.includes('All')) {
        setSelectedTokens(['All']);
      }
      if (selectedChains.length === 0 || !selectedChains.includes('All')) {
        setSelectedChains(['All']);
      }
    }, []); // Run only on mount
  
    // Add this useEffect for debugging
    useEffect(() => {
      console.log('CryptoPreferencesModal props:', {
        walletAddress,
        selectedTokens,
        selectedChains
      });
    }, [walletAddress, selectedTokens, selectedChains]);
  
    const isValidInput = (input: string): boolean => {
      // Check if empty
      if (!input) return true;
      
      // Check if it's a valid Ethereum address
      if (input.startsWith('0x')) {
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        return addressRegex.test(input);
      }
      
      // Check if it's a valid domain format (text.text.text)
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)+$/;
      return domainRegex.test(input);
    };
  
    const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      setWalletAddress(value);
    };
  
    const handleTokenSelection = (token: string): void => {
      if (token === 'All') {
        setSelectedTokens(['All']);
      } else {
        const newTokens = selectedTokens.filter(t => t !== 'All');
        if (newTokens.includes(token)) {
          const updatedTokens = newTokens.filter(t => t !== token);
          setSelectedTokens(updatedTokens.length === 0 ? ['All'] : updatedTokens);
        } else {
          setSelectedTokens([...newTokens, token]);
        }
      }
    };
  
    const handleChainSelection = (chain: string): void => {
      if (chain === 'All') {
        setSelectedChains(['All']);
      } else {
        const newChains = selectedChains.filter(c => c !== 'All');
        if (newChains.includes(chain)) {
          const updatedChains = newChains.filter(c => c !== chain);
          setSelectedChains(updatedChains.length === 0 ? ['All'] : updatedChains);
        } else {
          setSelectedChains([...newChains, chain]);
        }
      }
    };
  
    const handleSave = () => {
      if (walletAddress && isValidInput(walletAddress)) {
        // Generate the chain prefix string
        const chainPrefixes: { [key: string]: string } = {
            'Ethereum': 'eth',
            'Arbitrum': 'arb1',
            'Base': 'base',
            'Polygon': 'pol',
            'Optimism': 'oeth'
        };

        // Log the selected chains for debugging
        console.log('Selected Chains:', selectedChains);

        const selectedChainPrefixes = selectedChains
            .filter(chain => chain !== 'All') // Exclude 'All'
            .map(chain => chainPrefixes[chain]) // Map to prefixes
            .filter(Boolean); // Remove any undefined values

        // Log the generated prefixes for debugging
        console.log('Generated Chain Prefixes:', selectedChainPrefixes);

        const chainsParam = selectedChainPrefixes.length > 0 
            ? `chains=${selectedChainPrefixes.join(',')}` 
            : ''; // Create the chains parameter

        // Construct the payment link with the correct format
        const paymentLink = `https://yodl.me/${walletAddress}?amount=1&currency=USD&tokens=All&${chainsParam}`; // Example link
        console.log(`Generated payment link: ${paymentLink}`);

        // Call the onSave function with the payment link
        onSave(paymentLink); // Pass the payment link to the onSave function
        onClose();
      }
    };
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    };
  
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };
  
    return (
      <div 
        className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}
        onClick={handleBackdropClick}
      >
        <div 
          className="w-full md:max-w-2xl bg-white dark:bg-gray-800 rounded-t-[2rem] md:rounded-[2rem] shadow-2xl h-[90vh] md:h-auto overflow-hidden transform transition-all duration-200"
          onKeyDown={handleKeyDown}
        >
          <div className="p-6 md:p-8 h-full flex flex-col">
            <div className="mb-2 md:mb-8 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Payment Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                tabIndex={-1}
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 md:space-y-8 scrollbar-hide">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Address or Domain
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={handleWalletAddressChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border ${
                    walletAddress && !isValidInput(walletAddress)
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-500 dark:focus:ring-indigo-400'
                  } transition-all`}
                  placeholder="0x... or domain.name.eth"
                  tabIndex={0}
                />
                {walletAddress && !isValidInput(walletAddress) && (
                  <p className="mt-2 text-sm text-red-500">
                    Please enter a valid Ethereum address or domain (e.g., name.eth or sub.domain.eth)
                  </p>
                )}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Accepted Tokens
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TOKENS.map(token => (
                    <button
                      key={token}
                      onClick={() => handleTokenSelection(token)}
                      className={`px-4 py-2.5 rounded-lg transition-all ${
                        selectedTokens.includes(token)
                          ? 'bg-indigo-500 text-white shadow-lg hover:bg-indigo-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } active:scale-95 transform`}
                      tabIndex={-1}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Accepted Chains
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_CHAINS.map(chain => (
                    <button
                      key={chain}
                      onClick={() => handleChainSelection(chain)}
                      className={`px-4 py-2.5 rounded-lg transition-all ${
                        selectedChains.includes(chain)
                          ? 'bg-indigo-500 text-white shadow-lg hover:bg-indigo-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } active:scale-95 transform`}
                      tabIndex={-1}
                    >
                      {chain}
                    </button>
                  ))}
                </div>
              </div>
            </div>
  
            <div className="flex gap-3 mt-6 md:mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={!walletAddress || !isValidInput(walletAddress)}
                className="flex-1 p-4 rounded-xl text-white font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transform"
                tabIndex={0}
              >
                Save Settings
              </button>
              <button
                onClick={onClose}
                className="flex-1 p-4 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-[0.98] transform"
                tabIndex={-1}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }; 