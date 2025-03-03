import { useEffect, useState } from 'react';
import { useYodlPayment } from '@/hooks/useYodlPayment';
import { ChainPrefix, PaymentPreferences } from '@/types/yodl';
import React from 'react';

interface YodlPaymentButtonProps {
    walletAddress: string;
    selectedTokens: string[];
    selectedChains: string[];
    amount: number;
    currency: string;
}

const YodlPaymentButton: React.FC<YodlPaymentButtonProps> = ({
    walletAddress,
    selectedTokens,
    selectedChains,
    amount,
    currency
}) => {
    const { requestPayment, isLoading, error } = useYodlPayment();
    const [preferences, setPreferences] = useState<PaymentPreferences | null>(null);
    const [selectedChain, setSelectedChain] = useState<ChainPrefix>(ChainPrefix.ETH);

    useEffect(() => {
        // Get the JWT token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // Fetch user preferences
        if (token) {
            fetch(`/api/yodl/preferences?token=${token}`)
                .then(res => res.json())
                .then(data => setPreferences(data))
                .catch(console.error);
        }
    }, []);

    const generatePaymentLink = () => {
        // Construct the base payment link
        let paymentLink = `https://yodl.me/${walletAddress}?amount=${amount}&currency=${currency}`;

        // Handle tokens
        if (selectedTokens.length > 0 && !selectedTokens.includes('All')) {
            paymentLink += `&tokens=${selectedTokens.join(',')}`;
        }

        // Handle chains with correct prefixes
        if (selectedChains.length > 0 && !selectedChains.includes('All')) {
            const chainMapping: Record<string, string> = {
                'Ethereum': 'eth',
                'Arbitrum': 'arb1',
                'Base': 'base',
                'Polygon': 'pol',
                'Optimism': 'oeth'
            };

            console.log('Selected Chains:', selectedChains);
            
            const chainPrefixes = selectedChains
                .map(chain => {
                    const prefix = chainMapping[chain];
                    console.log(`Mapping ${chain} to ${prefix}`);
                    return prefix;
                })
                .filter(Boolean);

            console.log('Chain Prefixes after mapping:', chainPrefixes);

            if (chainPrefixes.length > 0) {
                const chainParam = `&chains=${chainPrefixes.join(',')}`;
                console.log('Adding chain parameter:', chainParam);
                paymentLink += chainParam;
            }
        }

        // Add additional URL parameters if they exist
        const buttonText = 'Return to Invoice';
        const redirectUrl = window.location.href;
        
        if (buttonText) {
            paymentLink += `&buttonText=${encodeURIComponent(buttonText)}`;
        }
        if (redirectUrl) {
            paymentLink += `&redirectUrl=${encodeURIComponent(redirectUrl)}`;
        }

        console.log('Final payment link:', paymentLink);
        return paymentLink;
    };

    const handlePayment = async () => {
        if (!preferences) return;

        try {
            const response = await requestPayment(preferences, {
                amount,
                currency: preferences.preferredCurrency,
                memo: 'test_payment',
                chainPrefix: selectedChain,
            });
            
            console.log('Transaction hash:', response.txHash);
            console.log('Chain ID:', response.chainId);
        } catch (err) {
            console.error('Payment failed:', err);
        }
    };

    if (!preferences) return <div>Loading preferences...</div>;

    return (
        <div>
            <p>Recipient: {preferences.ensName || preferences.address}</p>
            
            <select 
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value as ChainPrefix)}
            >
                {Object.entries(preferences.chainPreferences)
                    .filter(([_, pref]) => pref.isEnabled)
                    .map(([chain]) => (
                        <option key={chain} value={chain}>
                            {chain.toUpperCase()}
                        </option>
                    ))
                }
            </select>

            <button 
                onClick={handlePayment}
                disabled={isLoading}
            >
                {isLoading ? 'Processing...' : 'Pay'}
            </button>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default YodlPaymentButton; 