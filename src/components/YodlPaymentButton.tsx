import { useYodlPayment } from '@/hooks/useYodlPayment';
import { ChainPrefix, PaymentPreferences } from '@/types/yodl';
import YappSDK from '@yodlpay/yapp-sdk';
import { FiatCurrency } from '@yodlpay/yapp-sdk/dist/types/currency';
import React, { useState } from 'react';

interface YodlPaymentButtonProps {
  walletAddress: string;
  selectedTokens: string[];
  selectedChains: string[];
  amount: number;
  currency: string;
}

const sdk = new YappSDK({
  ensName: 'slipstream.yodl.eth',
});

const YodlPaymentButton: React.FC<YodlPaymentButtonProps> = ({
  walletAddress,
  amount,
}) => {
  const { isLoading, error } = useYodlPayment();
  const [preferences, setPreferences] = useState<PaymentPreferences | null>(
    null
  );
  const [selectedChain, setSelectedChain] = useState<ChainPrefix>(
    ChainPrefix.ETH
  );

  //   useEffect(() => {
  //     // Get the JWT token from URL
  //     const urlParams = new URLSearchParams(window.location.search);
  //     const token = urlParams.get('token');

  //     // Fetch user preferences
  //     if (token) {
  //       fetch(`/api/yodl/preferences?token=${token}`)
  //         .then((res) => res.json())
  //         .then((data) => setPreferences(data))
  //         .catch(console.error);
  //     }
  //   }, []);

  const handlePayment = async () => {
    if (!preferences) return;

    try {
      const response = await sdk.requestPayment(walletAddress, {
        amount,
        currency: FiatCurrency.USD,
        // You can mention the payment ID here so you can track the payment
        // memo: 'test_payment',
      });

      const { txHash, chainId } = response;
      console.log('Payment request sent:', response);
      console.log('Transaction hash:', txHash);
      console.log('Chain ID:', chainId);
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
          ))}
      </select>

      <button onClick={handlePayment} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Pay'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default YodlPaymentButton;