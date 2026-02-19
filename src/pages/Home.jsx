import React, { useState } from 'react';
import { ethers } from 'ethers';
import CanvasPickAsset from '../contracts/CanvasPickAsset.json';
import NFTCard from '../components/NFTCard';
import HomeTitle from '../components/HomeTitle';

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
      <div className="flex-1 flex flex-col justify-center space-y-2 select-none -translate-y-40 px-20">
        {/* <div className="flex space-x-4">
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
        </div> */}
        <HomeTitle />

        {/* Home.jsx: 카드들이 겹쳐서 나열될 하단 영역 */}
        <div className="absolute bottom-0 top-0 left-[40vw] flex justify-center items-end 
        perspective-[2000px] 
        [transform:rotateX(10deg)_rotateY(10deg)_rotateZ(-5deg)]
                -space-x-36 hover:-space-x-56 transition-all duration-500 ease-in-out group pb-10
          /* 2. 좌상단 Fade-in + Zoom-in 애니메이션 추가 */
          /* 초기 상태: 투명도 0, 축소(0.5), 좌상단 이동(-200px) */
          animate-[fade-zoom-in_1s_cubic-bezier(.09,.9,.29,.96)_forwards]
        ">

          {/* 카드 데이터 배열을 map으로 돌리면 더 편합니다 */}
          {[
            { id: "#00001", title: "별이 빛나는 밤에", artist: "엄준식" },
            { id: "#00002", title: "디지털 르네상스", artist: "비탈릭" },
            { id: "#00003", title: "얘 딴짓함", artist: "김하진" },
            { id: "#00004", title: "코드로 그린 풍경", artist: "이더리움" },
            { id: "#00005", title: "블록체인 속의 꿈", artist: "솔리디티" },
          ].map((nft, index) => (
            <div
              key={nft.id}
              style={{ zIndex: index, transform: `translateY(${index * 40}px)` }} // 뒤에 오는 카드가 위로 오게 설정
              className="
        relative flex-shrink-0 
        w-[32vh] aspect-[1/1.618] 
        rounded-[2.5rem] bg-black/40 backdrop-blur-xl 
        border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)] 
        px-8 py-8 select-none z-10
        hover:-translate-y-20 hover:scale-110 hover:rotate-3 
        hover:z-[50] transition-all duration-300 cursor-pixel
      "
            >
              <NFTCard
                imageSrc={nft.img}
                title={nft.title}
                artist={nft.artist}
                id={nft.id}
              />
            </div>
          ))}
        </div>
      </div>
    </div >
  );
}

export default Home;
