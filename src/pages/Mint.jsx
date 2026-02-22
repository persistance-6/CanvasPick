import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import CanvasPickAsset from '../contracts/CanvasPickAsset.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function Mint() {
    const { isConnected, account } = useWallet();

    // 입력 폼 상태 관리
    const [price, setPrice] = useState("0.0001");               // 1조각당 가격 (ETH 단위)
    const [metadataUri, setMetadataUri] = useState("");          // IPFS 메타데이터 URI
    const [royaltyAddress, setRoyaltyAddress] = useState(account || ""); // 로열티 수령 주소
    const [royaltyFee, setRoyaltyFee] = useState("5");          // 로열티 비율 (%)
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const handleMint = async (e) => {
        e.preventDefault();
        if (!window.ethereum) {
            setStatus("❌ MetaMask를 설치해주세요.");
            return;
        }
        if (!isConnected) {
            setStatus("❌ 지갑을 먼저 연결하세요.");
            return;
        }

        setLoading(true);
        setStatus("민팅 트랜잭션 전송 중...");

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CanvasPickAsset.abi, signer);

            // 화이트리스트 체크
            const isWhitelisted = await contract.whitelisted(account);
            if (!isWhitelisted) {
                setStatus("❌ 화이트리스트에 등록되지 않은 지갑입니다. 관리자에게 문의하세요.");
                setLoading(false);
                return;
            }

            // 가격 단위를 ETH → Wei 변환
            const priceInWei = ethers.parseEther(price);

            // 로열티 비율: % → basis points (5% = 500)
            const feeNumerator = Math.round(parseFloat(royaltyFee) * 100);

            // mintArt(uint256[] pricePerShares, bytes data, string[] uris, address royaltyReceiver, uint96 feeNumerator)
            const tx = await contract.mintArt(
                [priceInWei],
                "0x",
                [metadataUri],
                royaltyAddress || account,
                feeNumerator
            );

            setStatus("블록체인 확인 중 (Confirming)...");
            await tx.wait();

            setStatus("✅ 민팅 완료! 작품이 10,000조각으로 발행되었습니다.");
        } catch (err) {
            console.error(err);
            if (err.message?.includes("OwnableUnauthorizedAccount")) {
                setStatus("❌ 컨트랙트 배포자(Owner)만 민팅할 수 있습니다.");
            } else {
                setStatus(`❌ 오류: ${err.reason || err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-20 min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">작품 등록</h1>
                <p className="text-slate-500 mb-6 text-sm">
                    작품을 NFT로 민팅하여 10,000조각으로 분할 발행합니다.
                </p>

                {!isConnected ? (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">지갑을 먼저 연결하세요.</p>
                    </div>
                ) : (
                    <form onSubmit={handleMint} className="space-y-5">
                        {/* 메타데이터 URI */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                메타데이터 URI <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="ipfs://..."
                                value={metadataUri}
                                onChange={(e) => setMetadataUri(e.target.value)}
                                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Pinata 등에서 업로드 후 받은 IPFS URI를 입력하세요.</p>
                        </div>

                        {/* 조각당 가격 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                조각당 가격 (ETH) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                step="0.0001"
                                min="0.0001"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 로열티 수령 주소 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                로열티 수령 주소
                            </label>
                            <input
                                type="text"
                                placeholder={account || "0x..."}
                                value={royaltyAddress}
                                onChange={(e) => setRoyaltyAddress(e.target.value)}
                                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">비워두면 연결된 지갑 주소로 설정됩니다.</p>
                        </div>

                        {/* 로열티 비율 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                로열티 비율 (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={royaltyFee}
                                onChange={(e) => setRoyaltyFee(e.target.value)}
                                className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 민팅 요약 */}
                        <div className="p-4 bg-slate-50 rounded-lg space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">총 발행 조각 수</span>
                                <span className="font-semibold">10,000 조각</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">조각당 가격</span>
                                <span className="font-semibold">{price} ETH</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                <span className="font-bold">총 시가</span>
                                <span className="font-bold text-blue-600">
                                    {(parseFloat(price || 0) * 10000).toFixed(4)} ETH
                                </span>
                            </div>
                        </div>

                        {/* 상태 메시지 */}
                        {status && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${status.startsWith("✅")
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : status.startsWith("❌")
                                        ? "bg-red-50 text-red-800 border border-red-200"
                                        : "bg-blue-50 text-blue-800 border border-blue-200"
                                }`}>
                                {status}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-brand-gradient text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "처리 중..." : "작품 민팅하기"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Mint;
