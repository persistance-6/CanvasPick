import CanvasPickAsset from '../contracts/CanvasPickAsset.json';

// 이 앱이 동작하는 네트워크: Sepolia Testnet
export const TARGET_NETWORK = {
	chainId: '0xaa36a7',       // 11155111 (hex)
	chainName: 'Sepolia Testnet',
	nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
	rpcUrls: ['https://rpc.sepolia.org'],
	blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const CONTRACT_ABI = CanvasPickAsset.abi;
