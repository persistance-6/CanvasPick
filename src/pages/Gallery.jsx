import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatPrice, formatTokenAmount, ipfsToHttp } from '../utils/formatters';
import { fetchMetadata } from '../utils/metadata';
import { useEthPrice } from '../hooks/useEthPrice';
import { Loader2 } from 'lucide-react';
import { GalleryCard, GRID_LAYOUT_CLASS } from '../components/ArtworkCard';

function Gallery({ onArtworkSelect }) {
  const { isConnected } = useWallet();
  const { getAllArtIds, getSharePrice, getTokenURI, getAllHolders, getTotalShares } = useContract();
  const { weiToUsd } = useEthPrice();
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

      const totalSharesRes = await getTotalShares();
      const totalShares = BigInt(totalSharesRes.toString());

      // 2. 각 작품의 가격, URI, 메타데이터, 소유 분포 병렬 로드
      const artworkPromises = ids.map(async (id) => {
        const [price, uri, holdersRes] = await Promise.all([
          getSharePrice(id),
          getTokenURI(id),
          getAllHolders(id),
        ]);

        let metadata = null;
        try {
          metadata = await fetchMetadata(uri);
        } catch {
          console.warn(`작품 #${id} 메타데이터 로드 실패`);
        }

        const soldShares = holdersRes.balances.reduce((sum, balance) => sum + BigInt(balance.toString()), 0n);
        const availableShares = soldShares >= totalShares ? 0n : totalShares - soldShares;
        const artist = metadata?.attributes?.find((a) => a.trait_type === 'Artist')?.value ?? 'Unknown';

        return {
          id,
          title: metadata?.name ?? `Art Piece #${id}`,
          artist,
          image: metadata?.image,
          sharePrice: price.toString(),
          totalShares: totalShares.toString(),
          soldShares: soldShares.toString(),
          availableShares: availableShares.toString(),
          isSoldOut: availableShares === 0n,
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
  }, [isConnected, getAllArtIds, getSharePrice, getTokenURI, getAllHolders, getTotalShares]);

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
            <Loader2 className="w-10 h-10 text-brand-gradient animate-spin mb-4" />
            <p className="text-slate-600 font-medium">작품을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadArtworks}
                className="btn-brand-gradient"
            >
              다시 시도
            </button>
          </div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">아직 등록된 작품이 없습니다</p>
          </div>
        ) : (
          <div className={GRID_LAYOUT_CLASS}>
            {artworks.map(art => (
              <GalleryCard
                key={art.id}
                artwork={art}
                onSelect={onArtworkSelect}
                weiToUsd={weiToUsd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;
