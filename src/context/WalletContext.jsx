import React, { createContext, useContext, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const web3 = useWeb3();

  // 페이지 로드 시 연결된 지갑 확인
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            await web3.connect();
          }
        } catch (err) {
          console.error('지갑 확인 실패:', err);
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <WalletContext.Provider value={web3}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet은 WalletProvider 내에서만 사용할 수 있습니다');
  }
  return context;
};
