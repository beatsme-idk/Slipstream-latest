import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum, base, polygon, optimism } from 'wagmi/chains';
import { createPublicClient, http as viemHttp } from 'viem';

// Configure supported chains with RPC URLs
const chains = [
  {
    ...mainnet,
    rpcUrls: {
      default: { http: ['https://eth.llamarpc.com'] },
      public: { http: ['https://eth.llamarpc.com'] },
    },
  },
  {
    ...arbitrum,
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] },
      public: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
  },
  // Add other chains with their RPC URLs
];

// Create wagmi config
export const config = createConfig({
  chains,
  transports: Object.fromEntries(
    chains.map(chain => [chain.id, http()])
  ),
});

// Create public client for ENS resolution
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: viemHttp('https://eth.llamarpc.com'),
}); 