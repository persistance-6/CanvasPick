import React, { useState } from 'react';
import { ethers } from 'ethers';
import CanvasPickAsset from '../contracts/CanvasPickAsset.json';

// Remix에서 배포 후 받은 컨트랙트 주소
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function Home({ onArtworkSelect }) {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  
  // 입력 폼 상태 관리
  const [price, setPrice] = useState("0.0001"); // 1조각당 가격 (ETH 단위)
  const [metadataUri, setMetadataUri] = useState("ipfs://bafkreicks47z6tmz6zp7vpwrwlchlsdt62gpqwi5uyyhhhzp445xzcnvim"); // Pinata 등에서 받은 URI
  const [royaltyAddress, setRoyaltyAddress] = useState(""); // 로열티 수령 주소

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setRoyaltyAddress(accounts[0]); // 기본값으로 본인 주소 세팅
      } catch (err) {
        setStatus("지갑 연결 실패");
      }
    } else {
      alert("메타마스크를 설치해주세요!");
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!window.ethereum) return;

    try {
      setStatus("민팅 트랜잭션 전송 중...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CanvasPickAsset.abi, signer);

      // [추가] 화이트리스트 체크 로직
      const isWhite = await contract.whitelisted(account);
      if (!isWhite) {
        setStatus("오류: 화이트리스트에 등록되지 않은 지갑입니다.\n관리자에게 문의하세요.");
        return; // 화이트리스트가 아니면 여기서 중단
      }

      // 1. 가격 단위를 ETH에서 Wei로 변환
      const priceInWei = ethers.parseEther(price);
      
      // 2. 솔리디티 mintArt 함수 파라미터 구성
      // function mintArt(uint256[] pricePerShares, bytes data, string[] uris, address royaltyReceiver, uint96 feeNumerator)
      const prices = [priceInWei];      // 배열 형태
      const uris = [metadataUri];       // 배열 형태
      const data = "0x";                // 추가 데이터 (기본값)
      const feeNumerator = 500;         // 로열티 5% (500/10000)

      const tx = await contract.mintArt(
        prices, 
        data, 
        uris, 
        royaltyAddress, 
        feeNumerator
      );

      setStatus("블록체인 확인 중 (Confirming)...");
      await tx.wait();
      
      setStatus(`민팅 완료! 작품이 10,000조각으로 발행되었습니다.`);
    } catch (err) {
      console.error(err);
      // onlyOwner 에러 처리
      if (err.message.includes("OwnableUnauthorizedAccount")) {
        setStatus("오류: 컨트랙트 배포자(Owner)만 민팅할 수 있습니다.");
      } else {
        setStatus("에러 발생: " + err.reason || err.message);
      }
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50 flex flex-col p-6">
      <div className="max-w-md mx-auto my-auto w-full rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">CanvasPick</h1>
        <p className="text-slate-500 mb-8 text-sm">RWA Art Asset Management</p>

        {!account ? (
          <button onClick={connectWallet} className="w-full bg-blue-600 hover:bg-blue-700 text-black font-bold py-3 rounded-xl transition-all shadow-lg">
            지갑 연결하여 시작하기
          </button>
        ) : (
          <form onSubmit={handleMint} className="space-y-5">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-blue-600">Connected Wallet</p>
              <p className="text-xs truncate text-blue-900">{account}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">1조각당 가격 (ETH)</label>
              <input type="number" step="0.000001" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Metadata URI (IPFS)</label>
              <input type="text" value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)} className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="ipfs://..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">로열티 수령 주소 (Artist)</label>
              <input type="text" value={royaltyAddress} onChange={(e) => setRoyaltyAddress(e.target.value)} className="w-full p-3 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" className="w-full bg-slate-200 hover:bg-slate-300 text-black font-bold py-3 rounded-xl transition-all shadow-md">
              새로운 작품 등록 (10,000조각)
            </button>
            
            {status && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <p className="text-center text-xs text-yellow-800 font-medium whitespace-pre-line">{status}</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default Home;
