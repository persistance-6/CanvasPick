import React from 'react';
import { ImageOff } from 'lucide-react';
import { formatPrice, formatTokenAmount, formatPercentage, ipfsToHttp } from '../utils/formatters';

/**
 * 그리드 레이아웃 클래스 (공통 관리)
 * 기본: 4개 (lg), 작은 화면: 1-3개
 */
export const GRID_LAYOUT_CLASS = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

/**
 * Gallery용 작품 카드
 */
export function GalleryCard({ artwork, onSelect, weiToUsd }) {
  const imageUrl = ipfsToHttp(artwork.image);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onSelect(artwork.id)}
    >
      {/* 이미지 */}
      <div className="relative w-full aspect-square bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artwork.title}
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
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-xl font-bold text-slate-900 truncate">{artwork.title}</h2>
          {artwork.isSoldOut ? (
            <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              판매 완료
            </span>
          ) : (
            <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              구매 가능
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mb-4 truncate">by {artwork.artist}</p>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">조각당 가격</span>
            <div className="text-right">
              <span className="font-semibold text-slate-900">{formatPrice(artwork.sharePrice)}</span>
              {weiToUsd && weiToUsd(artwork.sharePrice) && (
                <p className="text-xs text-slate-400">{weiToUsd(artwork.sharePrice)}</p>
              )}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">판매 완료</span>
            <span className="font-semibold text-slate-900">{formatTokenAmount(artwork.soldShares ?? '0')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">구매 가능</span>
            <span className="font-semibold text-emerald-600">{formatTokenAmount(artwork.availableShares ?? artwork.totalShares)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MyAssets용 작품 카드
 */
export function AssetCard({ asset, onSelect, weiToUsd }) {
  const imageUrl = ipfsToHttp(asset.metadata?.image);
  const title = asset.metadata?.name ?? `Art Piece #${asset.id}`;
  const artist = asset.metadata?.attributes?.find((a) => a.trait_type === 'Artist')?.value ?? 'Unknown';
  const value = (BigInt(asset.price) * BigInt(asset.balance)).toString();

  return (
    <div
      onClick={() => onSelect?.(asset.id)}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* 이미지 */}
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
          className="absolute inset-0 items-center justify-center text-slate-400"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          <ImageOff className="w-10 h-10" />
        </div>
      </div>

      {/* 정보 */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{title}</h3>
            <p className="text-sm text-slate-500 truncate">by {artist}</p>
          </div>
          <span className="shrink-0 ml-2 px-2.5 py-0.5 bg-gradient-to-r from-slate-100 to-slate-200 text-brand-gradient text-xs font-semibold rounded-full">
            #{asset.id}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">보유 조각</span>
            <span className="font-semibold text-slate-900">
              {formatTokenAmount(asset.balance)}
              <span className="text-slate-400 font-normal ml-1">
                ({formatPercentage(asset.balance, 10000)})
              </span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">조각당 가격</span>
            <div className="text-right">
              <span className="font-semibold text-slate-900">{formatPrice(asset.price)}</span>
              {weiToUsd && weiToUsd(asset.price) && (
                <p className="text-xs text-slate-400">{weiToUsd(asset.price)}</p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between">
            <span className="text-slate-500">총 가치</span>
            <div className="text-right">
              <span className="font-bold text-brand-gradient">{formatPrice(value)}</span>
              {weiToUsd && weiToUsd(value) && (
                <p className="text-xs text-slate-400">{weiToUsd(value)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
