import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import ArtworkDetail from './pages/ArtworkDetail';
import Purchase from './pages/Purchase';
import MyAssets from './pages/MyAssets';
import { formatAddress } from './utils/formatters';
import "./App.css";
import logo from './assets/logo.jpg'; // 경로 주의!

function Navigation({ currentPage, setCurrentPage, isConnected, account, onConnect }) {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 및 네비게이션 */}
          <div className="flex items-center gap-8">
  
          {/* [로고 및 CanvasPick 글자 영역] - 항상 보임 */}
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 group" // 로고와 글자 사이 간격 및 그룹화
          >
            <img 
              src={logo} 
              alt="CanvasPick Logo" 
              className="h-9 w-auto object-contain rounded-md" // 4k에서도 너무 작지 않게 h-9(36px) 적용
            />
            <span className="hidden md:flex text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
              CanvasPick
            </span>
          </button>
            
            <div className="hidden md:flex gap-6">
              <button
                onClick={() => setCurrentPage('gallery')}
                className={`font-semibold transition-colors ${
                  currentPage === 'gallery'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                갤러리
              </button>
              {isConnected && (
                <>
                  <button
                    onClick={() => setCurrentPage('purchase')}
                    className={`font-semibold transition-colors ${
                      currentPage === 'purchase'
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    구매
                  </button>
                  <button
                    onClick={() => setCurrentPage('assets')}
                    className={`font-semibold transition-colors ${
                      currentPage === 'assets'
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    내 자산
                  </button>
                  <button
                    onClick={() => setCurrentPage('mint')}
                    className={`font-semibold transition-colors ${
                      currentPage === 'mint'
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    작품 등록
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 지갑 버튼 */}
          <button
            onClick={onConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isConnected ? formatAddress(account) : '지갑 연결'}
          </button>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedArtworkId, setSelectedArtworkId] = useState(1);
  const { isConnected, account, connect } = useWallet();

  const handleNavigateToArtwork = (id) => {
    setSelectedArtworkId(id);
    setCurrentPage('detail');
  };

  const handleConnect = async () => {
    if (!isConnected) {
      await connect();
    }
  };

  return (
    <>
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isConnected={isConnected}
        account={account}
        onConnect={handleConnect}
      />

      <main>
        {currentPage === 'home' && <Home onArtworkSelect={handleNavigateToArtwork} />}
        {currentPage === 'gallery' && <Gallery onArtworkSelect={handleNavigateToArtwork} />}
        {currentPage === 'detail' && <ArtworkDetail artworkId={selectedArtworkId} />}
        {currentPage === 'purchase' && <Purchase />}
        {currentPage === 'mint' && <Home />}
        {currentPage === 'assets' && <MyAssets />}
      </main>
    </>
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
