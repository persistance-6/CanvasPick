import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatAddress, formatPrice, formatTokenAmount, formatPercentage, formatEth, ipfsToHttp } from '../utils/formatters';
import { fetchMetadata } from '../utils/metadata';
import { useEthPrice } from '../hooks/useEthPrice';
import { CONTRACT_ADDRESS, TARGET_NETWORK } from '../constants/contract';
import ConfirmModal from '../components/ConfirmModal';
import {
  Loader2, ArrowLeft, ImageOff, ExternalLink,
  Users, Tag, Layers, BarChart3, Info, FileText, Shield,
  ChevronDown, ChevronUp, Copy, Check, ShoppingCart, AlertCircle,
} from 'lucide-react';

/** 접을 수 있는 섹션 컴포넌트 (OpenSea 스타일 아코디언) */
function CollapsibleSection({ icon: Icon, title, defaultOpen = true, count, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <Icon className="w-4 h-4" />
          {title}
          {count != null && (
            <span className="text-xs font-normal text-slate-400">({count})</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-200">{children}</div>}
    </div>
  );
}

/** 주소 복사 버튼 */
function CopyableAddress({ address, short = true }) {
  const [copied, setCopied] = useState(false);
  const display = short ? formatAddress(address) : address;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-brand-gradient hover:opacity-80 transition-opacity">
      <span className="font-mono text-xs">{display}</span>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ArtworkDetail({ artworkId = 1, onBack }) {
  const { isConnected, account } = useWallet();
  const { getSharePrice, getAllHolders, getTokenURI, buyArtworks, getTotalShares } = useContract();

  const [metadata, setMetadata] = useState(null);
  const [price, setPrice] = useState(null);
  const [holders, setHolders] = useState([]);
  const [totalShares, setTotalShares] = useState('10000');
  const [tokenUri, setTokenUri] = useState('');
  const { weiToUsd } = useEthPrice();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 구매 관련 state
  const [buyAmount, setBuyAmount] = useState('0');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadArtwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [priceRes, holdersRes, uriRes, totalSharesRes] = await Promise.all([
        getSharePrice(artworkId),
        getAllHolders(artworkId),
        getTokenURI(artworkId),
        getTotalShares(),
      ]);

      setPrice(priceRes.toString());
      setTokenUri(uriRes);
      setTotalShares(totalSharesRes.toString());

      const holderList = holdersRes.holders.map((addr, idx) => ({
        address: addr,
        balance: holdersRes.balances[idx].toString(),
      }));
      // 보유량 내림차순 정렬
      holderList.sort((a, b) => Number(BigInt(b.balance) - BigInt(a.balance)));
      setHolders(holderList);

      try {
        const meta = await fetchMetadata(uriRes);
        setMetadata(meta);
      } catch {
        console.warn('메타데이터 로드 실패');
      }
    } catch (err) {
      console.error('작품 상세 로드 실패:', err);
      setError('작품 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [artworkId, getSharePrice, getAllHolders, getTokenURI, getTotalShares]);

  useEffect(() => {
    loadArtwork();
  }, [loadArtwork]);

  // --- 구매 함수 ---
  const handleBuyClick = () => {
    if (!isConnected) {
      setPurchaseError('지갑을 먼저 연결해주세요.');
      return;
    }

    const amount = parseInt(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      setPurchaseError('올바른 수량을 입력해주세요.');
      return;
    }

    if (BigInt(amount) > availableShares) {
      setPurchaseError(`구매 가능한 수량은 최대 ${formatTokenAmount(availableShares.toString())}개입니다.`);
      return;
    }

    // 검증 통과 시 확인 모달 표시
    setPurchaseError(null);
    setShowConfirmModal(true);
  };

  const handleBuyArtwork = async () => {
    const amount = parseInt(buyAmount);

    setShowConfirmModal(false);
    setPurchasing(true);
    setPurchaseError(null);
    setPurchaseSuccess(false);

    try {
      const totalPrice = BigInt(price) * BigInt(amount);
      const tx = await buyArtworks([artworkId], [amount], totalPrice.toString());
      
      // 트랜잭션 대기
      await tx.wait();
      
      setPurchaseSuccess(true);
      setBuyAmount('0');
      
      // 작품 정보 새로고침
      setTimeout(() => {
        loadArtwork();
        setPurchaseSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('구매 실패:', err);
      let errorMsg = '구매에 실패했습니다.';
      
      if (err.code === 'ACTION_REJECTED') {
        errorMsg = '사용자가 트랜잭션을 거부했습니다.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMsg = '잔액이 부족합니다.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setPurchaseError(errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  // --- 파생 데이터 ---
  const imageUrl = ipfsToHttp(metadata?.image);
  const title = metadata?.name ?? `Art Piece #${artworkId}`;
  const description = metadata?.description ?? '';
  const attributes = metadata?.attributes ?? [];
  const artist = attributes.find((a) => a.trait_type === 'Artist')?.value ?? 'Unknown';

  const totalSharesBigInt = BigInt(totalShares || '10000');
  const soldShares = holders.reduce((sum, h) => sum + BigInt(h.balance), 0n);
  const availableShares = soldShares >= totalSharesBigInt ? 0n : totalSharesBigInt - soldShares;
  const totalMarketCap = price ? (BigInt(price) * totalSharesBigInt).toString() : '0';

  // 현재 사용자의 보유량
  const myHolding = holders.find(
    (h) => h.address.toLowerCase() === account?.toLowerCase()
  );

  // Etherscan 링크
  const etherscanBase = TARGET_NETWORK.blockExplorerUrls[0];
  const contractLink = `${etherscanBase}/address/${CONTRACT_ADDRESS}`;
  const tokenLink = `${etherscanBase}/token/${CONTRACT_ADDRESS}?a=${artworkId}`;

  // --- 로딩/에러 ---
  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-gradient animate-spin mb-4" />
        <p className="text-slate-600 font-medium">작품 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadArtwork} className="btn-brand-gradient">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 뒤로가기 */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium text-sm mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ════════════ 왼쪽: 이미지 + 설명 + 속성 + 세부정보 ════════════ */}
          <div className="lg:col-span-2 space-y-4">

            {/* 이미지 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="relative w-full aspect-square bg-slate-100">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
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
                  <ImageOff className="w-16 h-16" />
                </div>
              </div>
            </div>

            {/* 세부 정보 */}
            <CollapsibleSection icon={Info} title="세부 정보">
              <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed">
                <p className="text-xs text-slate-400 mb-1">by <span className="text-slate-600 font-medium">{artist}</span></p>
                {description ? (
                  <p>{description}</p>
                ) : (
                  <p className="text-slate-400 italic">설명이 없습니다.</p>
                )}
              </div>
              <div className="border-t border-slate-200 px-5 py-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">컨트랙트 주소</span>
                  <a href={contractLink} target="_blank" rel="noreferrer" className="text-brand-gradient hover:opacity-80 transition-opacity font-mono text-xs flex items-center gap-1">
                    {formatAddress(CONTRACT_ADDRESS)} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">토큰 ID</span>
                  <span className="font-semibold text-slate-900">{artworkId.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">토큰 표준</span>
                  <span className="font-semibold text-slate-900">ERC-1155</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">체인</span>
                  <span className="font-semibold text-slate-900">{TARGET_NETWORK.chainName}</span>
                </div>
                {metadata?.image && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">원본 이미지</span>
                    <a href={ipfsToHttp(metadata.image)} target="_blank" rel="noreferrer" className="text-brand-gradient hover:opacity-80 transition-opacity text-xs flex items-center gap-1 max-w-[180px] truncate">
                      보기 <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* 속성 (Traits) */}
            {attributes.length > 0 && (
              <CollapsibleSection icon={Tag} title="속성" count={attributes.length}>
                <div className="p-4 space-y-2">
                  {attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-[11px] font-semibold text-brand-gradient uppercase tracking-wider shrink-0 mr-4">
                        {attr.trait_type}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate text-right" title={attr.value}>
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* ════════════ 오른쪽: 타이틀 + 가격 + 소유 통계 + 홀더 목록 ════════════ */}
          <div className="lg:col-span-3 space-y-4">

            {/* 타이틀 영역 */}
            <div>
              <p className="text-sm text-brand-gradient font-semibold">CanvasPick Collection</p>
              <h1 className="text-4xl font-bold text-slate-900 my-2">{title}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>by <span className="text-slate-700 font-medium">{artist}</span></span>
                <span>·</span>
                <a href={tokenLink} target="_blank" rel="noreferrer" className="text-brand-gradient hover:opacity-80 transition-opacity flex items-center gap-1">
                  Etherscan 보기 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 가격 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">조각당 현재 가격</p>
              <div className="flex items-baseline gap-3 mb-4">
                <p className="text-3xl font-bold text-slate-900">{formatPrice(price)}</p>
                {weiToUsd(price) && (
                  <p className="text-lg text-slate-400 font-medium">{weiToUsd(price)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-0.5">시가총액</p>
                  <p className="text-sm font-bold text-slate-900">{formatPrice(totalMarketCap)}</p>
                  {weiToUsd(totalMarketCap) && (
                    <p className="text-[10px] text-slate-400">{weiToUsd(totalMarketCap)}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-0.5">총 조각</p>
                  <p className="text-sm font-bold text-slate-900">{formatTokenAmount(totalShares)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-0.5">판매 완료</p>
                  <p className="text-sm font-bold text-slate-900">{formatTokenAmount(soldShares.toString())}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-0.5">구매 가능</p>
                  <p className="text-sm font-bold text-emerald-600">{formatTokenAmount(availableShares.toString())}</p>
                </div>
              </div>

              {/* 판매 진행률 바 */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>판매율</span>
                  <span>{formatPercentage(Number(soldShares), Number(totalSharesBigInt))}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                    style={{ width: `${Number(totalSharesBigInt) > 0 ? (Number(soldShares) / Number(totalSharesBigInt)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* 구매 폼 */}
              {isConnected && availableShares > 0n && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        구매 수량
                      </label>

                      {/* 슬라이더 */}
                      <div className="mb-3">
                        <input
                          type="range"
                          min="0"
                          max={availableShares.toString()}
                          step="100"
                          value={buyAmount || 0}
                          onChange={(e) => {
                            const nextAmount = BigInt(e.target.value || '0');
                            const clamped = nextAmount > availableShares ? availableShares : nextAmount;
                            setBuyAmount(clamped.toString());
                          }}
                          disabled={purchasing}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-primary disabled:opacity-50
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-[12px] text-slate-400 mt-1 px-0.5">
                          <span>0</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* 수량 입력 + 구매 버튼 */}
                      <div className="flex gap-3">
                        <input
                          type="number"
                          min="0"
                          max={availableShares.toString()}
                          value={buyAmount}
                          onChange={(e) => {
                            const inputValue = parseInt(e.target.value) || 0;
                            const maxValue = Number(availableShares);
                            const clamped = Math.min(maxValue, Math.max(0, inputValue));
                            setBuyAmount(clamped.toString());
                          }}
                          disabled={purchasing}
                          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-100"
                          placeholder="수량 입력"
                        />
                        <button
                          onClick={handleBuyClick}
                          disabled={purchasing || !buyAmount || buyAmount === '0'}
                          className="btn-brand-gradient disabled:bg-slate-300 disabled:opacity-100 flex items-center gap-2 whitespace-nowrap text-slate-900 font-bold cursor-pointer"
                        >
                          {purchasing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              구매 중...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              구매하기
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 총 결제 금액 */}
                    {buyAmount && !isNaN(parseInt(buyAmount)) && parseInt(buyAmount) > 0 && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">총 결제 금액</span>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900">
                              {formatPrice((BigInt(price) * BigInt(parseInt(buyAmount))).toString())}
                            </p>
                            {weiToUsd((BigInt(price) * BigInt(parseInt(buyAmount))).toString()) && (
                              <p className="text-sm text-slate-500">
                                {weiToUsd((BigInt(price) * BigInt(parseInt(buyAmount))).toString())}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 에러 메시지 */}
                    {purchaseError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{purchaseError}</p>
                      </div>
                    )}

                    {/* 성공 메시지 */}
                    {purchaseSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700">구매가 완료되었습니다!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 지갑 미연결 안내 */}
              {!isConnected && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-700 font-medium">
                      작품을 구매하려면 지갑을 연결해주세요.
                    </p>
                  </div>
                </div>
              )}

              {/* 매진 안내 */}
              {isConnected && availableShares === 0n && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-600 font-semibold">
                      모든 조각이 판매되었습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 소유 분포 차트 (텍스트 기반)
            <CollapsibleSection icon={BarChart3} title="소유 분포">
              <div className="px-5 py-4 space-y-3">
                {holders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">아직 소유자가 없습니다.</p>
                ) : (
                  holders.slice(0, 5).map((h, idx) => {
                    const pct = (Number(h.balance) / Number(totalSharesBigInt)) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <CopyableAddress address={h.address} />
                          <span className="text-slate-500">
                            {formatTokenAmount(h.balance)} ({pct.toFixed(2)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-gradient rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
                {holders.length > 5 && (
                  <p className="text-xs text-slate-400 text-center">외 {holders.length - 5}명의 소유자</p>
                )}
              </div>
            </CollapsibleSection> */}

            {/* 전체 홀더 목록 */}
            <CollapsibleSection icon={Users} title="소유자 목록" count={holders.length} defaultOpen={false}>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {holders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">소유자 정보가 없습니다.</p>
                ) : (
                  <>
                    {/* 내 보유분 (맨 위에 강조 표시) */}
                    {myHolding && (
                      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-emerald-50 to-cyan-50 border-b-2 border-brand-primary">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <CopyableAddress address={myHolding.address} />
                            <p className="text-[10px] text-brand-gradient font-semibold mt-0.5">내 보유</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatTokenAmount(myHolding.balance)} 조각</p>
                          <p className="text-xs text-slate-600 font-medium">{formatPercentage(myHolding.balance, totalShares)}</p>
                        </div>
                      </div>
                    )}
                    {/* 전체 홀더 목록 */}
                    {holders.map((holder, idx) => (
                      <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                            {idx + 1}
                          </div>
                          <CopyableAddress address={holder.address} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatTokenAmount(holder.balance)} 조각</p>
                          <p className="text-xs text-slate-400">{formatPercentage(holder.balance, totalShares)}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CollapsibleSection>

          </div>
        </div>
      </div>

      {/* 구매 확인 모달 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="구매 확인"
        message="정말 구매하시겠습니까?"
        confirmText="구매하기"
        cancelText="취소"
        onConfirm={handleBuyArtwork}
        isProcessing={purchasing}
      >
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">구매 수량</span>
            <span className="text-lg font-bold text-slate-900">{formatTokenAmount(buyAmount)} 조각</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">조각당 가격</span>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">{formatPrice(price)}</span>
              {weiToUsd(price) && (
                <p className="text-xs text-slate-400">{weiToUsd(price)}</p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
            <span className="text-sm text-slate-700 font-semibold">총 결제 금액</span>
            <div className="text-right">
              <span className="text-xl font-bold text-brand-gradient">
                {formatPrice((BigInt(price) * BigInt(parseInt(buyAmount) || 0)).toString())}
              </span>
              {weiToUsd((BigInt(price) * BigInt(parseInt(buyAmount) || 0)).toString()) && (
                <p className="text-sm text-slate-500">
                  {weiToUsd((BigInt(price) * BigInt(parseInt(buyAmount) || 0)).toString())}
                </p>
              )}
            </div>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default ArtworkDetail;
