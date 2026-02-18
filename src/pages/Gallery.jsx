import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatPrice, formatTokenAmount } from '../utils/formatters';

function Gallery({ onArtworkSelect }) {
  const { isConnected, account } = useWallet();
  const { getTokenURI } = useContract();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 임시: 테스트용 작품 ID 리스트
  // 실제로는 컨트랙트에서 getAllArtworks() 같은 함수로 가져와야 함
  const sampleArtworkIds = [1, 2, 3];

  useEffect(() => {
    const loadArtworks = async () => {
      if (!isConnected) return;
      
      setLoading(true);
      try {
        // TODO: 실제 구현 시 컨트랙트에서 작품 목록을 동적으로 가져오기
        // 임시로 샘플 데이터 사용
        const artworks = sampleArtworkIds.map(id => ({
          id,
          title: `Art Piece ${id}`,
          artist: 'Artist Name',
          sharePrice: '0.0001',
          totalShares: 10000,
        }));
        setArtworks(artworks);
      } catch (err) {
        console.error('작품 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadArtworks();
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Art Gallery</h1>

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">지갑을 연결하여 작품을 감상하세요</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">로딩 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map(art => (
              <div key={art.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="bg-slate-200 h-48 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">Image ID: {art.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{art.title}</h2>
                <p className="text-sm text-slate-600 mb-4">by {art.artist}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">조각당 가격</span>
                    <span className="font-semibold text-slate-900">{formatPrice(art.sharePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">총 조각</span>
                    <span className="font-semibold text-slate-900">{formatTokenAmount(art.totalShares)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onArtworkSelect(art.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  상세 정보
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;
