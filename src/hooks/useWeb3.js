import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { TARGET_NETWORK } from '../constants/contract';

/**
 * 지정된 네트워크(Sepolia)로 전환을 요청합니다.
 * 네트워크가 MetaMask에 없으면 자동으로 추가합니다.
 */
const switchToTargetNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TARGET_NETWORK.chainId }],
    });
  } catch (err) {
    // 4902: 해당 체인이 MetaMask에 등록되지 않은 경우 → 추가 요청
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [TARGET_NETWORK],
      });
    } else {
      throw err;
    }
  }
};

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
      // 1. 먼저 Sepolia로 네트워크 전환 요청
      await switchToTargetNetwork();

      // 2. 계정 연결
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
