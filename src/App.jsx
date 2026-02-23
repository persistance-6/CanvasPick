import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import ArtworkDetail from './pages/ArtworkDetail';
import Mint from './pages/Mint';
import MintSuccess from './pages/MintSuccess';
import MyAssets from './pages/MyAssets';
import WalletModal from './components/WalletModal';
import { formatAddress } from './utils/formatters';
import "./App.css";
import logo from './assets/logo.jpg';
import { Search, Menu, ShoppingCart } from 'lucide-react';

function Navigation({ currentPage, setCurrentPage, isConnected, account, onConnect, onWalletClick }) {
  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${currentPage === 'home' ? 'bg-white/0' : 'bg-white/70 shadow-sm border-b border-white/20'
      } backdrop-blur-md`}>
      <div className="max-w-[96%] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 및 네비게이션 */}
          <div className="flex items-center gap-5">

            {/* [로고 및 CanvasPick 글자 영역] - 항상 보임 */}
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 group cursor-pointer hover:scale-103 transition-transform duration-250" // 로고와 글자 사이 간격 및 그룹화
            >
              <img
                src={logo}
                alt="CanvasPick Logo"
                className="h-9 w-auto object-contain rounded-md" // 4k에서도 너무 작지 않게 h-9(36px) 적용
              />
              <span className="hidden md:flex text-2xl font-extrabold text-brand-gradient transition-colors">
                CanvasPick
              </span>
            </button>

            <Search className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />

            <div className="hidden md:flex gap-6">
              <button
                onClick={() => setCurrentPage('gallery')}
                className={`nav-link ${currentPage === 'gallery' ? 'active' : ''}`}
              >
                갤러리
              </button>
              {isConnected && (
                <>
                  <button
                    onClick={() => setCurrentPage('assets')}
                    className={`nav-link ${currentPage === 'assets' ? 'active' : ''}`}
                  >
                    내 자산
                  </button>
                  <button
                    onClick={() => setCurrentPage('mint')}
                    className={`nav-link ${currentPage === 'mint' ? 'active' : ''}`}
                  >
                    작품 등록
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={isConnected ? onWalletClick : onConnect}
              className="btn-brand-gradient text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isConnected ? formatAddress(account) : '지갑 연결'}
            </button>
            <Menu className="md:hidden w-6 h-6 hover:text-blue-600 cursor-pointer" />
            <ShoppingCart className="w-5 h-5 hover:text-blue-600 cursor-pointer" />
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedArtworkId, setSelectedArtworkId] = useState(1);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { isConnected, account, provider, connect, disconnect } = useWallet();

  const handleNavigateToArtwork = (id) => {
    setSelectedArtworkId(id);
    setCurrentPage('detail');
  };

  const handleConnect = async () => {
    if (!isConnected) {
      await connect();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    // 지갑 연결 해제 시 인증이 필요한 페이지에서 홈으로 이동
    const protectedPages = ['assets', 'mint'];
    if (protectedPages.includes(currentPage)) {
      setCurrentPage('home');
    }
  };

  return (
    <div className="relative min-h-screen">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isConnected={isConnected}
        account={account}
        onConnect={handleConnect}
        onWalletClick={() => setIsWalletModalOpen(true)}
      />

      {/* 지갑 정보 모달 */}
      {isWalletModalOpen && isConnected && (
        <WalletModal
          account={account}
          provider={provider}
          onDisconnect={handleDisconnect}
          onClose={() => setIsWalletModalOpen(false)}
        />
      )}

      <main className="min-h-screen">
        {currentPage === 'home' && <Home onArtworkSelect={handleNavigateToArtwork} />}
        {currentPage === 'gallery' && <Gallery onArtworkSelect={handleNavigateToArtwork} />}
        {currentPage === 'detail' && <ArtworkDetail artworkId={selectedArtworkId} />}
        {currentPage === 'mint' && <Mint onMintSuccess={() => setCurrentPage('mint-success')} />}
        {currentPage === 'mint-success' && <MintSuccess onNavigateHome={() => setCurrentPage('home')} />}
        {currentPage === 'assets' && <MyAssets />}
      </main>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
