import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatPrice, formatTokenAmount, ipfsToHttp } from '../utils/formatters';
import { fetchMetadata } from '../utils/metadata';
import { Loader2, ImageOff } from 'lucide-react';

function Gallery({ onArtworkSelect }) {
  const { isConnected } = useWallet();
  const { getAllArtIds, getSharePrice, getTokenURI } = useContract();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadArtworks = useCallback(async () => {
    if (!isConnected) return;
    
    setLoading(true);
    setError(null);
    try {
      // 1. 모든 작품 ID 가져오기
      const ids = await getAllArtIds();
      console.log('등록된 작품 IDs:', ids);

      // 2. 각 작품의 가격, URI, 메타데이터 병렬 로드
      const artworkPromises = ids.map(async (id) => {
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

        const artist = metadata?.attributes?.find((a) => a.trait_type === 'Artist')?.value ?? 'Unknown';

        return {
          id,
          title: metadata?.name ?? `Art Piece #${id}`,
          artist,
          image: metadata?.image,
          sharePrice: price.toString(),
          totalShares: 10000,
        };
      });

      const loaded = await Promise.all(artworkPromises);
      setArtworks(loaded);
    } catch (err) {
      console.error('작품 로드 실패:', err);
      setError('작품 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isConnected, getAllArtIds, getSharePrice, getTokenURI]);

  useEffect(() => {
    loadArtworks();
  }, [loadArtworks]);

  return (
    <div className="pt-20 min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Art Gallery</h1>

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">지갑을 연결하여 작품을 감상하세요</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">작품을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadArtworks}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">아직 등록된 작품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map(art => {
              const imageUrl = ipfsToHttp(art.image);
              return (
                <div key={art.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 이미지 */}
                  <div className="relative w-full aspect-square bg-slate-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="absolute inset-0 items-center justify-center text-slate-300"
                      style={{ display: imageUrl ? 'none' : 'flex' }}
                    >
                      <ImageOff className="w-12 h-12" />
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-1 truncate">{art.title}</h2>
                    <p className="text-sm text-slate-600 mb-4 truncate">by {art.artist}</p>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;
