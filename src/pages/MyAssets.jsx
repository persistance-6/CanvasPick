import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatTokenAmount, formatPrice, ipfsToHttp } from '../utils/formatters';
import { fetchMetadata } from '../utils/metadata';
import { useEthPrice } from '../hooks/useEthPrice';
import { Loader2, RefreshCw } from 'lucide-react';
import { AssetCard, GRID_LAYOUT_CLASS } from '../components/ArtworkCard';

function MyAssets({ onArtworkSelect }) {
  const { isConnected, account } = useWallet();
  const { getUserPortfolio, getSharePrice, getTokenURI } = useContract();
  const { weiToUsd } = useEthPrice();

  // 자산 목록: { id, balance, price, metadata: { name, image, description, attributes } }
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPortfolio = useCallback(async () => {
    if (!isConnected || !account) return;

    setLoading(true);
    setError(null);
    try {
      // 1) 컨트랙트에서 사용자 포트폴리오(ID + 잔액) 조회
      const { ids, balances } = await getUserPortfolio(account);
      console.log('포트폴리오 조회:', ids, balances);

      // 잔액이 0인 항목은 제외 (이전에 보유했다가 전부 매도한 경우)
      const activeIndices = ids
        .map((id, idx) => ({ id, idx }))
        .filter(({ idx }) => BigInt(balances[idx]) > 0n);

      // 2) 각 작품의 가격 · URI · 메타데이터를 병렬로 가져오기
      const assetPromises = activeIndices.map(async ({ id, idx }) => {
        const [price, uri] = await Promise.all([
          getSharePrice(id),
          getTokenURI(id),
        ]);

        let metadata = null;
        try {
          metadata = await fetchMetadata(uri);
        } catch {
          console.warn(`작품 #${id} 메타데이터 로드 실패`);
        }

        return {
          id: id.toString(),
          balance: balances[idx].toString(),
          price: price.toString(),
          metadata,
        };
      });

      const loaded = await Promise.all(assetPromises);
      setAssets(loaded);
    } catch (err) {
      console.error('포트폴리오 로드 실패:', err);
      setError('자산 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [isConnected, account, getUserPortfolio, getSharePrice, getTokenURI]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // --- 계산 헬퍼 ---
  const calcValue = (price, balance) =>
    (BigInt(price) * BigInt(balance)).toString();

  const totalValue = assets
    .reduce((sum, a) => sum + BigInt(calcValue(a.price, a.balance)), 0n)
    .toString();

  const totalShares = assets
    .reduce((sum, a) => sum + BigInt(a.balance), 0n)
    .toString();

  return (
    <div className="pt-20 min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">나의 자산</h1>
            <p className="text-slate-600">보유한 작품 조각들을 확인하세요</p>
          </div>
          {isConnected && !loading && (
            <button
              onClick={loadPortfolio}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
          )}
        </div>

        {/* 지갑 미연결 */}
        {!isConnected ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-slate-600">지갑을 연결하여 자산을 확인하세요</p>
          </div>

        /* 로딩 */
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
            <Loader2 className="w-10 h-10 text-brand-gradient animate-spin mb-4" />
            <p className="text-slate-600 font-medium">자산을 불러오는 중입니다...</p>
          </div>

        /* 에러 */
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadPortfolio}
                className="btn-brand-gradient"
            >
              다시 시도
            </button>
          </div>

        /* 빈 포트폴리오 */
        ) : assets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-slate-600">보유한 작품이 없습니다</p>
          </div>

        /* 자산 목록 */
        ) : (
          <div className="space-y-8">
            {/* ── 요약 카드 ── */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">총 자산 가치</p>
                  <p className="text-2xl font-bold text-brand-gradient">{formatPrice(totalValue)}</p>
                  {weiToUsd(totalValue) && (
                    <p className="text-sm text-slate-400 font-medium">{weiToUsd(totalValue)}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">보유 작품 수</p>
                  <p className="text-2xl font-bold text-slate-900">{assets.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">총 조각 수</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatTokenAmount(totalShares)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 자산 카드 그리드 ── */}
            <div className={GRID_LAYOUT_CLASS}>
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onSelect={onArtworkSelect}
                  weiToUsd={weiToUsd}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAssets;
