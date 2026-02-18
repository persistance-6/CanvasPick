import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatTokenAmount, formatPercentage, formatPrice } from '../utils/formatters';
import { Loader2 } from 'lucide-react';

function MyAssets() {
  const { isConnected, account } = useWallet();
  const { getUserPortfolio, getSharePrice } = useContract();
  const [portfolio, setPortfolio] = useState({ ids: [], balances: [] });
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!isConnected || !account) return;

      setLoading(true);
      try {
        const { ids, balances } = await getUserPortfolio(account);
        setPortfolio({ ids, balances });

        // 각 작품의 가격 조회
        const priceMap = {};
        for (const id of ids) {
          const price = await getSharePrice(id);
          priceMap[id] = price.toString();
        }
        setPrices(priceMap);
      } catch (err) {
        console.error('포트폴리오 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [isConnected, account, getUserPortfolio, getSharePrice]);

  const calculateValue = (id, balance) => {
    if (!prices[id]) return '0';
    return (BigInt(prices[id]) * BigInt(balance)).toString();
  };

  const totalValue = portfolio.ids.reduce((sum, id, idx) => {
    return sum + BigInt(calculateValue(id, portfolio.balances[idx]));
  }, BigInt(0)).toString();

  return (
    <div className="pt-20 min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">나의 자산</h1>
        <p className="text-slate-600 mb-8">보유한 작품 조각들을 확인하세요</p>

        {!isConnected ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-slate-600 mb-4">지갑을 연결하여 자산을 확인하세요</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">자산을 불러오는 중입니다...</p>
          </div>
        ) : portfolio.ids.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-slate-600 mb-4">보유한 작품이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 요약 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">총 자산 가치</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">보유 작품 수</p>
                  <p className="text-2xl font-bold text-slate-900">{portfolio.ids.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">총 조각 수</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatTokenAmount(
                      portfolio.balances.reduce((sum, b) => sum + BigInt(b), BigInt(0)).toString()
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 작품 목록 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">작품 ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">보유 조각</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">조각당 가격</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">총 가치</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.ids.map((id, idx) => {
                      const balance = portfolio.balances[idx];
                      const price = prices[id];
                      const value = calculateValue(id, balance);

                      return (
                        <tr key={id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-semibold text-blue-600">#Art Piece {id}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{formatTokenAmount(balance)}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{formatPrice(price)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatPrice(value)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatPercentage(balance, 10000)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAssets;
