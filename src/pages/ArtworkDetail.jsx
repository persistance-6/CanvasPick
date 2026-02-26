import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { formatAddress, formatPrice, formatTokenAmount, formatPercentage, formatEth, ipfsToHttp } from '../utils/formatters';
import { CONTRACT_ADDRESS, TARGET_NETWORK } from '../constants/contract';
import {
  Loader2, ArrowLeft, ImageOff, ExternalLink,
  Users, Tag, Layers, BarChart3, Info, FileText, Shield,
  ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react';

/**
 * 토큰 URI에서 메타데이터 JSON을 가져온다.
 */
async function fetchMetadata(uri) {
  const url = ipfsToHttp(uri);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`메타데이터 fetch 실패 (${res.status})`);
  return res.json();
}

/** 접을 수 있는 섹션 컴포넌트 (OpenSea 스타일 아코디언) */
function CollapsibleSection({ icon: Icon, title, defaultOpen = true, count, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
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
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors">
      <span className="font-mono text-xs">{display}</span>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ArtworkDetail({ artworkId = 1, onBack }) {
  const { isConnected, account } = useWallet();
  const { getSharePrice, getAllHolders, getTokenURI } = useContract();

  const [metadata, setMetadata] = useState(null);
  const [price, setPrice] = useState(null);
  const [holders, setHolders] = useState([]);
  const [tokenUri, setTokenUri] = useState('');
  const [ethPriceUsd, setEthPriceUsd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TOTAL_SHARES = 10000;

  const loadArtwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [priceRes, holdersRes, uriRes] = await Promise.all([
        getSharePrice(artworkId),
        getAllHolders(artworkId),
        getTokenURI(artworkId),
      ]);

      setPrice(priceRes.toString());
      setTokenUri(uriRes);

      // CoinGecko에서 ETH → USD 가격 조회
      try {
        const cgRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const cgData = await cgRes.json();
        if (cgData?.ethereum?.usd) setEthPriceUsd(cgData.ethereum.usd);
      } catch {
        setEthPriceUsd(null);
      }

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
  }, [artworkId, getSharePrice, getAllHolders, getTokenURI]);

  useEffect(() => {
    loadArtwork();
  }, [loadArtwork]);

  // --- 파생 데이터 ---
  const imageUrl = ipfsToHttp(metadata?.image);
  const title = metadata?.name ?? `Art Piece #${artworkId}`;
  const description = metadata?.description ?? '';
  const attributes = metadata?.attributes ?? [];
  const artist = attributes.find((a) => a.trait_type === 'Artist')?.value ?? 'Unknown';

  const soldShares = holders.reduce((sum, h) => sum + BigInt(h.balance), 0n);
  const availableShares = BigInt(TOTAL_SHARES) - soldShares;
  const totalMarketCap = price ? (BigInt(price) * BigInt(TOTAL_SHARES)).toString() : '0';

  /** wei 값을 달러 문자열로 변환 */
  const weiToUsd = (wei) => {
    if (!wei || !ethPriceUsd) return null;
    const ethValue = parseFloat(formatEth(wei));
    return (ethValue * ethPriceUsd).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
  };

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
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">작품 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadArtwork} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 뒤로가기 */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium text-sm mb-6 transition-colors"
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

            {/* 설명 */}
            <CollapsibleSection icon={FileText} title="설명">
              <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed">
                <p className="text-xs text-slate-400 mb-1">by <span className="text-slate-600 font-medium">{artist}</span></p>
                {description ? (
                  <p>{description}</p>
                ) : (
                  <p className="text-slate-400 italic">설명이 없습니다.</p>
                )}
              </div>
            </CollapsibleSection>

            {/* 속성 (Traits) */}
            {attributes.length > 0 && (
              <CollapsibleSection icon={Tag} title="속성" count={attributes.length}>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
                    >
                      <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-0.5">
                        {attr.trait_type}
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* 세부 정보 */}
            <CollapsibleSection icon={Info} title="세부 정보" defaultOpen={false}>
              <div className="px-5 py-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">컨트랙트 주소</span>
                  <a href={contractLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1">
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
                {tokenUri && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">메타데이터</span>
                    <a href={ipfsToHttp(tokenUri)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1 max-w-[180px] truncate">
                      IPFS <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* ════════════ 오른쪽: 타이틀 + 가격 + 소유 통계 + 홀더 목록 ════════════ */}
          <div className="lg:col-span-3 space-y-4">

            {/* 타이틀 영역 */}
            <div>
              <p className="text-sm text-blue-600 font-semibold mb-1">CanvasPick Collection</p>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{title}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>by <span className="text-slate-700 font-medium">{artist}</span></span>
                <span>·</span>
                <a href={tokenLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
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
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 mb-0.5">총 조각</p>
                  <p className="text-sm font-bold text-slate-900">{formatTokenAmount(TOTAL_SHARES)}</p>
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
                  <span>{formatPercentage(Number(soldShares), TOTAL_SHARES)}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(Number(soldShares) / TOTAL_SHARES) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 내 보유 현황 (연결 시) */}
            {isConnected && myHolding && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-800">내 보유 현황</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-blue-400">보유 조각</p>
                    <p className="text-lg font-bold text-blue-900">{formatTokenAmount(myHolding.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-400">지분율</p>
                    <p className="text-lg font-bold text-blue-900">{formatPercentage(myHolding.balance, TOTAL_SHARES)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-400">보유 가치</p>
                    <p className="text-lg font-bold text-blue-900">
                      {formatPrice((BigInt(price) * BigInt(myHolding.balance)).toString())}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 소유 분포 차트 (텍스트 기반) */}
            <CollapsibleSection icon={BarChart3} title="소유 분포">
              <div className="px-5 py-4 space-y-3">
                {holders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">아직 소유자가 없습니다.</p>
                ) : (
                  holders.slice(0, 5).map((h, idx) => {
                    const pct = (Number(h.balance) / TOTAL_SHARES) * 100;
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
                            className="h-full bg-blue-500 rounded-full"
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
            </CollapsibleSection>

            {/* 전체 홀더 목록 */}
            <CollapsibleSection icon={Users} title="소유자 목록" count={holders.length} defaultOpen={false}>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {holders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">소유자 정보가 없습니다.</p>
                ) : (
                  holders.map((holder, idx) => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </div>
                        <CopyableAddress address={holder.address} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatTokenAmount(holder.balance)} 조각</p>
                        <p className="text-xs text-slate-400">{formatPercentage(holder.balance, TOTAL_SHARES)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtworkDetail;
