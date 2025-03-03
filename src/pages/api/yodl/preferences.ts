import { NextApiRequest, NextApiResponse } from 'next';
import { validateYodlToken } from '@/lib/yodlSDK';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.query.token as string;
    
    // Validate the JWT token
    const payload = await validateYodlToken(token);
    
    // Return user preferences including their wallet address and ENS
    return res.status(200).json({
      address: payload.sub, // User's Ethereum address
      ensName: payload.ens, // User's primary ENS name
      community: payload.iss, // Community ENS name
      // You can add more user preferences here from your database
      preferredCurrency: 'USD', // Example - you might want to fetch this from your DB
    });

  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
} 