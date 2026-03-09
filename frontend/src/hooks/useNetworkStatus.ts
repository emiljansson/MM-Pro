import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: Network.NetworkStateType | null;
  isLoading: boolean;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isLoading: true,
  });

  const checkNetwork = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setStatus({
        isConnected: networkState.isConnected ?? false,
        isInternetReachable: networkState.isInternetReachable ?? false,
        type: networkState.type ?? null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking network:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    checkNetwork();
    
    // Check network status periodically
    const interval = setInterval(checkNetwork, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    refresh: checkNetwork,
  };
};

// Utility function to check network before API calls
export const checkNetworkBeforeRequest = async (): Promise<boolean> => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected === true && networkState.isInternetReachable === true;
  } catch {
    return true; // Assume connected if check fails
  }
};
