import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { YodlPaymentButton } from '../components/YodlPaymentButton';
import type { FiatCurrency } from '@yodlpay/yapp-sdk';

export default function CheckoutPage() {
  const { address } = useAccount();
  const [preferencesToken, setPreferencesToken] = useState<string>();
  
  // Fetch user preferences token when address is available
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!address) return;
      
      try {
        // Replace with your API endpoint
        const response = await fetch('/api/yodl/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });
        
        const data = await response.json();
        setPreferencesToken(data.token);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    };

    void fetchPreferences();
  }, [address]);

  const recipientAddress = 'slipstream.yodl.eth';
  const amount = 100;
  const currency = 'USD' as FiatCurrency;
  const memo = 'order_123';

  return (
    <div className="container mx-auto p-4">
      <h1>Checkout</h1>
      <YodlPaymentButton
        recipientAddress={recipientAddress}
        amount={amount}
        currency={currency}
        memo={memo}
        userAddress={address}
        preferencesToken={preferencesToken}
      />
    </div>
  );
} 