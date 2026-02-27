import { useState, useEffect, useCallback } from 'react';
import { formatEth } from '../utils/formatters';

/**
 * CoinGecko API를 통해 ETH → USD 환율을 가져오는 커스텀 훅.
 * weiToUsd 헬퍼 함수도 함께 제공한다.
 */
export function useEthPrice() {
  const [ethPriceUsd, setEthPriceUsd] = useState(null);

  const fetchEthPrice = useCallback(async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await res.json();
      if (data?.ethereum?.usd) setEthPriceUsd(data.ethereum.usd);
    } catch {
      setEthPriceUsd(null);
    }
  }, []);

  useEffect(() => {
    fetchEthPrice();
  }, [fetchEthPrice]);

  /** wei 값을 달러 문자열로 변환 */
  const weiToUsd = useCallback(
    (wei) => {
      if (!wei || !ethPriceUsd) return null;
      const ethValue = parseFloat(formatEth(wei));
      return (ethValue * ethPriceUsd).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      });
    },
    [ethPriceUsd]
  );

  return { ethPriceUsd, weiToUsd };
}
