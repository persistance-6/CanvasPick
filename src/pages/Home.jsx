import React, { useState } from 'react';
import { ethers } from 'ethers';
import CanvasPickAsset from '../contracts/CanvasPickAsset.json';
import BigPixelCursor from '../components/icons/BigPixelCursor';

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
    <div className="pt-20 min-h-screen bg-brand-bg flex flex-col p-6 select-none">
      <div className="flex-1 flex flex-col items-center justify-center space-y-2 select-none -translate-y-40">
        <div className="flex space-x-4">
          <span>
            <p className="home-title">
              Pick
            </p>
          </span>
          <span>
            <p className="home-title">
              Your
            </p>
          </span>
          <span>
            <p className="home-title">
              Canvas
            </p>
          </span>
        </div>


        <div className="absolute bottom-1/4 left-1/2 right-1/2 -rotate-8">
          <BigPixelCursor className="w-32 h-32" />
        </div>
      </div>
    </div>
  );
}

export default Home;
