import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatAddress, formatPrice, formatTokenAmount, formatPercentage } from '../utils/formatters';

function ArtworkDetail({ artworkId = 1 }) {
  const { isConnected, provider } = useWallet();
  const { getSharePrice, getAllHolders } = useContract();
  const [artwork, setArtwork] = useState(null);
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtwork = async () => {
      if (!isConnected) return;

      setLoading(true);
      try {
        const price = await getSharePrice(artworkId);
        const { holders: holderList, balances } = await getAllHolders(artworkId);

        setArtwork({
          id: artworkId,
          title: `Art Piece #${artworkId}`,
          artist: 'Artist Name',
          description: '이것은 샘플 작품입니다.',
          sharePrice: price,
          totalShares: 10000,
          holders: holderList.length,
        });

        setHolders(
          holderList.map((addr, idx) => ({
            address: addr,
            balance: balances[idx],
          }))
        );
      } catch (err) {
        console.error('작품 상세 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadArtwork();
  }, [isConnected, artworkId, getSharePrice, getAllHolders]);

  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button className="text-blue-600 hover:text-blue-700 font-semibold mb-6">
          ← 갤러리로 돌아가기
        </button>

        {artwork && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 이미지 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="bg-slate-200 h-96 rounded-lg flex items-center justify-center mb-6">
                <span className="text-slate-400">Image ID: {artwork.id}</span>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
                🛒 이 작품 구매하기
              </button>
            </div>

            {/* 정보 */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{artwork.title}</h1>
                <p className="text-slate-600 mb-4">by {artwork.artist}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">조각당 가격</span>
                    <span className="font-semibold text-lg text-blue-600">{formatPrice(artwork.sharePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">총 조각 수</span>
                    <span className="font-semibold">{formatTokenAmount(artwork.totalShares)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">홀더 수</span>
                    <span className="font-semibold">{artwork.holders}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-700">{artwork.description}</p>
              </div>

              {/* 홀더 목록 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">소유자 현황 ({holders.length}명)</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {holders.length === 0 ? (
                    <p className="text-slate-600 text-sm">홀더 정보 없음</p>
                  ) : (
                    holders.map((holder, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                        <span className="text-slate-700">{formatAddress(holder.address)}</span>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">{formatTokenAmount(holder.balance)}</div>
                          <div className="text-xs text-slate-500">{formatPercentage(holder.balance, artwork.totalShares)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtworkDetail;
