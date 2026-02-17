import { useState } from 'react';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState("");

  // 1. 지갑 연결 로직
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
      } catch (error) {
        console.error("연결 오류:", error);
      }
    } else {
      // 메타마스크 설치 페이지로 안내
      window.open("https://metamask.io", "_blank");
    }
  };

  // 2. 인라인 스타일 정의 (2026 핀테크 테마)
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#000000', // Pitch Black
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      backgroundColor: 'transparent',
      color: '#39FF14', // Neon Green
      border: '1px solid #39FF14',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.3s ease',
      fontWeight: 'bold',
      letterSpacing: '1px',
    },
    accountText: {
      color: '#39FF14',
      fontSize: '18px',
      textShadow: '0 0 10px rgba(57, 255, 20, 0.5)',
      fontFamily: 'monospace',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ marginBottom: '40px', letterSpacing: '-1px' }}>CanvasPick</h1>
      
      {account ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#888', marginBottom: '8px' }}>Wallet Connected</p>
          <p style={styles.accountText}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>
      ) : (
        <button 
          style={styles.button}
          onClick={connectWallet}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#39FF14';
            e.target.style.color = '#000000';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#39FF14';
          }}
        >
          CONNECT WALLET
        </button>
      )}
    </div>
  );
}

export default App;
