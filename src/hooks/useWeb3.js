import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWeb3 = () => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('메타마스크를 설치해주세요!');
      return false;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();

      setAccount(accounts[0]);
      setProvider(_provider);
      setSigner(_signer);

      return true;
    } catch (err) {
      console.error('지갑 연결 실패:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount('');
    setProvider(null);
    setSigner(null);
  }, []);

  return {
    account,
    provider,
    signer,
    isConnecting,
    connect,
    disconnect,
    isConnected: !!account,
  };
};
