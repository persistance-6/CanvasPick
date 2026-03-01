import React, { useRef, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import CanvasPickAsset from '../contracts/CanvasPickAsset.json';
import { uploadArtwork } from '../services/pinataService';
import FormInput from '../components/FormInput';
import FormTextArea from '../components/FormTextArea';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

/** 로얄티는 플랫폼 정책으로 고정 */
const ROYALTY_FEE_PERCENT = 5; // 5%
const ROYALTY_FEE_NUMERATOR = ROYALTY_FEE_PERCENT * 100; // basis points

function Mint({ onMintSuccess }) {
    const { isConnected, account } = useWallet();
    const fileInputRef = useRef(null);

    // ── 폼 상태 ──────────────────────────────────────
    const [artworkName, setArtworkName]         = useState('');
    const [description, setDescription]         = useState('');
    const [artistId, setArtistId]               = useState('');
    const [price, setPrice]                     = useState('0.0001');
    const [storageLocation, setStorageLocation] = useState('');
    const [imageFile, setImageFile]             = useState(null);   // File 객체
    const [imagePreview, setImagePreview]       = useState(null);   // 미리보기 URL

    // ── 진행 상태 ─────────────────────────────────────
    const [step, setStep]     = useState('');   // 단계 텍스트
    const [status, setStatus] = useState('');   // 최종 결과
    const [loading, setLoading] = useState(false);

    // 이미지 선택 핸들러
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleMint = async (e) => {
        e.preventDefault();
        if (!window.ethereum) { setStatus('❌ MetaMask를 설치해주세요.'); return; }
        if (!isConnected)     { setStatus('❌ 지갑을 먼저 연결하세요.');  return; }
        if (!imageFile)       { setStatus('❌ 작품 이미지를 선택해주세요.'); return; }

        setLoading(true);
        setStatus('');

        try {
            // ── Step 0: 다음 작품 ID 조회 ────────────────
            setStep('🔍 작품 ID 확인 중...');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer   = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CanvasPickAsset.abi, signer);

            const allIds = await contract.getAllArtIds();
            const nextArtId = allIds.length + 1;

            // ── Step 1: 이미지 + 메타데이터를 IPFS 폴더로 업로드 ─────────
            setStep('📤 이미지와 메타데이터를 IPFS에 업로드 중...');
            const metadataUri = await uploadArtwork(imageFile, {
                name: artworkName,
                description,
                artistId,
                pricePerShare: price,
                storageLocation,
                artId: nextArtId,
            });

            // ── Step 2: 민팅 트랜잭션 전송 ───────────────
            setStep('⛓️ 블록체인에 민팅 트랜잭션 전송 중...');
            
            const priceInWei = ethers.parseEther(price);

            const tx = await contract.mintArt(
                [priceInWei],
                '0x',
                [metadataUri],
                account,            // 로열티 수령 = 민팅 지갑
                ROYALTY_FEE_NUMERATOR
            );

            setStep('⏳ 블록 확인 중 (Confirming)...');
            await tx.wait();

            // 민팅 성공 → MintSuccess 페이지로 이동 (민팅된 작품 ID 전달)
            onMintSuccess?.(nextArtId);
        } catch (err) {
            console.error(err);
            if (err.message?.includes('OwnableUnauthorizedAccount')) {
                setStatus('❌ 컨트랙트 배포자(Owner)만 민팅할 수 있습니다.');
            } else {
                setStatus(`❌ 오류: ${err.reason ?? err.message}`);
            }
        } finally {
            setLoading(false);
            setStep('');
        }
    };

    return (
        <div className="pt-20 min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">작품 등록</h1>
                <p className="text-slate-500 mb-6 text-sm">
                    작품 정보를 입력하면 이미지와 메타데이터가 함께 IPFS 폴더로 업로드된 후
                    10,000조각 NFT로 민팅됩니다.
                </p>

                {!isConnected ? (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">지갑을 먼저 연결하세요.</p>
                    </div>
                ) : (
                    <form onSubmit={handleMint} className="space-y-5">

                        {/* 작품 이미지 업로드 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                작품 이미지 <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200
                                           bg-slate-50 hover:bg-slate-100 transition-colors
                                           flex items-center justify-center cursor-pointer overflow-hidden"
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="미리보기"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center text-slate-400 text-sm select-none">
                                        <p className="text-2xl mb-1">🖼️</p>
                                        <p>클릭하여 이미지 선택</p>
                                        <p className="text-xs mt-0.5">PNG / JPG / GIF / WEBP</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* 작품 이름 */}
                        <FormInput
                            label="작품 이름"
                            required
                            placeholder="별이 빛나는 밤에"
                            value={artworkName}
                            onChange={(e) => setArtworkName(e.target.value)}
                        />

                        {/* 작품 설명 */}
                        <FormTextArea
                            label="작품 설명"
                            required
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        {/* 작가 고유 ID */}
                        <FormInput
                            label="작가 ID"
                            required
                            placeholder="임시 인풋입니다. 아무거나 입력하세요."
                            value={artistId}
                            onChange={(e) => setArtistId(e.target.value)}
                            hint="플랫폼에서 사용하는 작가 고유 식별자입니다."
                        />

                        {/* 실물 보관 장소 */}
                        <FormInput
                            label="실물 보관 장소"
                            required
                            placeholder="치장 창고 한구석"
                            value={storageLocation}
                            onChange={(e) => setStorageLocation(e.target.value)}
                        />

                        {/* 조각당 가격 */}
                        <FormInput
                            label="조각당 가격 (ETH)"
                            required
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            placeholder="0.000001"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />

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
                            <div className="flex justify-between">
                                <span className="text-slate-500">로열티</span>
                                <span className="font-semibold">{ROYALTY_FEE_PERCENT}% (고정)</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                <span className="font-bold">총 시가</span>
                                          <span className="font-bold text-brand-gradient">
                                    {(parseFloat(price || 0) * 10000).toFixed(4)} ETH
                                </span>
                            </div>
                        </div>

                        {/* 진행 단계 표시 */}
                        {loading && step && (
                                     <div className="p-3 rounded-lg text-sm font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border border-slate-200 flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                {step}
                            </div>
                        )}

                        {/* 최종 결과 메시지 */}
                        {!loading && status && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${
                                status.startsWith('✅')
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {status}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-brand-gradient text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '처리 중...' : '작품 민팅하기'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Mint;
