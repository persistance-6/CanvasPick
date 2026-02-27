import { useCallback } from 'react';
import { contractService } from '../services/contractService';
import { useWallet } from '../context/WalletContext';

export const useContract = () => {
  const { provider, signer } = useWallet();

  const getSharePrice = useCallback(
    async (id) => {
      return contractService.getSharePrice(id, provider);
    },
    [provider]
  );

  const getUserPortfolio = useCallback(
    async (address) => {
      return contractService.getUserPortfolio(address, provider);
    },
    [provider]
  );

  const getAllHolders = useCallback(
    async (id) => {
      return contractService.getAllHolders(id, provider);
    },
    [provider]
  );

  const buyArtworks = useCallback(
    async (ids, amounts, totalPrice) => {
      return contractService.buyArtworks(ids, amounts, totalPrice, signer);
    },
    [signer]
  );

  const mintArt = useCallback(
    async (prices, uris, royaltyAddress, feeNumerator) => {
      return contractService.mintArt(prices, uris, royaltyAddress, feeNumerator, signer);
    },
    [signer]
  );

  const getTokenURI = useCallback(
    async (id) => {
      return contractService.getTokenURI(id, provider);
    },
    [provider]
  );

  const getAllArtIds = useCallback(
    async () => {
      return contractService.getAllArtIds(provider);
    },
    [provider]
  );

  return {
    getSharePrice,
    getUserPortfolio,
    getAllHolders,
    buyArtworks,
    mintArt,
    getTokenURI,
    getAllArtIds,
  };
};
