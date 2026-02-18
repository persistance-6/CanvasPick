import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatPrice, formatTokenAmount } from '../utils/formatters';

function Purchase() {
  const { isConnected, account } = useWallet();
  const { getSharePrice, buyArtworks } = useContract();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // 구매 폼 상태
  const [artworkId, setArtworkId] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [sharePrice, setSharePrice] = useState('0');

  useEffect(() => {
    const loadPrice = async () => {
      if (!artworkId) return;
      try {
        const price = await getSharePrice(artworkId);
        setSharePrice(price.toString());
      } catch (err) {
        console.error('가격 로드 실패:', err);
      }
    };

    loadPrice();
  }, [artworkId, getSharePrice]);

  const totalPrice = sharePrice && quantity ? (BigInt(sharePrice) * BigInt(quantity)).toString() : '0';

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      setStatus('지갑을 먼저 연결하세요');
      return;
    }

    setLoading(true);
    setStatus('트랜잭션 전송 중...');

    try {
      const tx = await buyArtworks([artworkId], [quantity], totalPrice);
      setStatus('블록체인 확인 중...');
      await tx.wait();
      setStatus('✅ 구매 완료!');
      setQuantity(1);
    } catch (err) {
      console.error('구매 실패:', err);
      setStatus(`❌ 오류: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">작품 구매</h1>
        <p className="text-slate-600 mb-6">조각을 선택하여 구매하세요</p>

        {!isConnected ? (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">지갑을 먼저 연결하세요</p>
          </div>
        ) : (
          <form onSubmit={handlePurchase} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">작품 ID</label>
              <input
                type="number"
                min="1"
                value={artworkId}
                onChange={(e) => setArtworkId(parseInt(e.target.value) || 1)}
                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">구매 조각 수</label>
              <input
                type="number"
                min="1"
                max="10000"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>조각당 가격</span>
                <span className="font-semibold">{formatPrice(sharePrice)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-bold">총액</span>
                <span className="font-bold text-blue-600">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-all shadow-md"
            >
              {loading ? '처리 중...' : '구매하기'}
            </button>

            {status && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <p className="text-center text-xs text-yellow-800 font-medium">{status}</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default Purchase;
