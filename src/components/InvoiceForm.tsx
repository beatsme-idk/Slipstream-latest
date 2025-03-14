import React from 'react';
import { useYodlUser } from '../hooks/useYodlUser';

interface InvoiceFormProps {
  companyInfo: {
    details: string;
  };
  readOnly?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ companyInfo: initialCompanyInfo, readOnly = false }) => {
  const { userData, isLoading, error, isConnected } = useYodlUser();

  // Use Yodl user data to populate company info if available
  const companyInfo = {
    details: userData?.ensName || userData?.address || initialCompanyInfo.details
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Invoice From
      </label>
      <input
        type="text"
        value={isLoading ? "Loading..." : companyInfo.details || ""}
        readOnly={true}
        disabled={true}
        className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm cursor-not-allowed text-gray-700 dark:text-gray-300"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {isLoading ? (
          "Loading Yodl connection..."
        ) : error ? (
          <span className="text-red-500">{error}</span>
        ) : isConnected ? (
          `Connected as: ${userData?.ensName || userData?.address}`
        ) : (
          "Waiting for connection from Yodl..."
        )}
      </p>

      {userData && (
        <div className="mt-2 space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Accepted Tokens:</strong> {userData.tokens.join(', ')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Supported Chains:</strong> {userData.chains.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}; 