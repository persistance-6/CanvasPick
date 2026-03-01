import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ethers } from 'ethers';
import { Copy, LogOut, X, CheckCheck, AlertTriangle } from 'lucide-react';
import { formatAddress } from '../utils/formatters';
import { TARGET_NETWORK } from '../constants/contract';

/**
 * 지갑 정보 모달
 * - 지갑 주소 (전체 표시 + 복사 버튼)
 * - 자산 목록 (ETH 잔액 + 보유 NFT 조각 수 — 향후 확장 가능)
 * - 지갑 연결 해제 버튼
 */
function WalletModal({ account, provider, onDisconnect, onClose }) {
    const modalRef = useRef(null);
    const [ethBalance, setEthBalance] = useState(null);
    const [usdBalance, setUsdBalance] = useState(null);
    const [networkName, setNetworkName] = useState('');
    const [isWrongNetwork, setIsWrongNetwork] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(true);

    // 모달 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // ETH 잔액 및 네트워크 조회
    // provider prop 대신 window.ethereum으로 직접 호출 — 네트워크 무관하게 항상 현재 연결 체인 기준
    useEffect(() => {
        const fetchBalanceAndNetwork = async () => {
            if (!account || !window.ethereum) return;
            try {
                setLoadingBalance(true);

                // 잔액 조회: eth_getBalance RPC 직접 호출
                const balanceHex = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [account, 'latest'],
                });
                const balanceEthNum = parseFloat(ethers.formatEther(balanceHex));
                const balanceEth = balanceEthNum.toFixed(4);
                setEthBalance(balanceEth);

                // CoinGecko에서 ETH 현재 USD 가격 조회
                try {
                    const priceRes = await fetch(
                        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
                    );
                    const priceData = await priceRes.json();
                    const ethPriceUsd = priceData?.ethereum?.usd;
                    if (ethPriceUsd) {
                        const usd = (balanceEthNum * ethPriceUsd).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 2,
                        });
                        setUsdBalance(usd);
                    }
                } catch {
                    setUsdBalance(null);
                }

                // 네트워크(체인) 이름 조회
                const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                const chainId = parseInt(chainIdHex, 16);
                const NETWORK_NAMES = {
                    1: 'Ethereum Mainnet',
                    11155111: 'Sepolia Testnet',
                    5: 'Goerli Testnet',
                    137: 'Polygon',
                    80001: 'Mumbai Testnet',
                };
                setNetworkName(NETWORK_NAMES[chainId] ?? `Chain ${chainId}`);
                setIsWrongNetwork(chainIdHex.toLowerCase() !== TARGET_NETWORK.chainId.toLowerCase());
            } catch (err) {
                console.error('잔액 조회 실패:', err);
                setEthBalance('—');
            } finally {
                setLoadingBalance(false);
            }
        };

        fetchBalanceAndNetwork();
    }, [account]);

    // 주소 복사
    const handleCopy = async () => {
        await navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDisconnect = () => {
        onDisconnect();
        onClose();
    };

    const handleSwitchNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: TARGET_NETWORK.chainId }],
            });
            // 전환 후 잔액 재조회를 위해 상태 초기화
            setLoadingBalance(true);
            setIsWrongNetwork(false);
        } catch (err) {
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [TARGET_NETWORK],
                });
            }
        }
    };

    return createPortal(
        // 배경 오버레이
        <div className="fixed inset-0 z-[100] flex items-start justify-end pt-[72px] pr-4">
            <div
                ref={modalRef}
                className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden
                   animate-[slide-down-fade-in_0.2s_ease-out_forwards]"
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-700">내 지갑</span>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* 잘못된 네트워크 경고 */}
                {isWrongNetwork && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs font-medium">Sepolia Testnet이 아닙니다</span>
                        </div>
                        <button
                            onClick={handleSwitchNetwork}
                            className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors flex-shrink-0"
                        >
                            전환하기
                        </button>
                    </div>
                )}

                {/* 지갑 주소 */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs text-slate-400 mb-1 font-medium">지갑 주소</p>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono text-slate-800 break-all leading-relaxed">
                            {formatAddress(account)}
                        </span>
                        <button
                            onClick={handleCopy}
                            title="주소 복사"
                               className="flex-shrink-0 text-slate-400 hover:text-brand-gradient transition-colors"
                        >
                            {copied
                                ? <CheckCheck className="w-4 h-4 text-green-500" />
                                : <Copy className="w-4 h-4" />
                            }
                        </button>
                    </div>
                    {/* 전체 주소 */}
                    <p className="text-[10px] text-slate-400 mt-1 font-mono break-all">{account}</p>
                </div>

                {/* 자산 목록 */}
                <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium">자산</p>
                        {networkName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100">
                                {networkName}
                            </span>
                        )}
                    </div>

                    {/* ETH 잔액 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 font-bold text-xs">Ξ</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Ethereum</p>
                                <p className="text-xs text-slate-400">ETH</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {loadingBalance ? (
                                <span className="text-sm text-slate-400">로딩 중...</span>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-slate-800">{ethBalance} ETH</p>
                                    {usdBalance && (
                                        <p className="text-xs text-slate-400 mt-0.5">≈ {usdBalance}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* TODO: 보유 CanvasPick 조각 목록 표시 */}
                </div>

                {/* 연결 해제 버튼 */}
                <div className="px-5 py-4">
                    <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center justify-center gap-2
                       py-2.5 rounded-xl border border-red-200
                       text-red-500 text-sm font-semibold
                       hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        지갑 연결 해제
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default WalletModal;
