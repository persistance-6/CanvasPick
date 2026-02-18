import { ethers } from 'ethers';
import CanvasPickAsset from '../contracts/CanvasPickAsset.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const contractService = {
  /**
   * 컨트랙트 인스턴스 생성
   */
  getContract(signer) {
    if (!signer) throw new Error('Signer가 필요합니다');
    return new ethers.Contract(CONTRACT_ADDRESS, CanvasPickAsset.abi, signer);
  },

  /**
   * 읽기 전용 컨트랙트 인스턴스
   */
  getReadOnlyContract(provider) {
    if (!provider) {
      provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, CanvasPickAsset.abi, provider);
  },

  /**
   * 특정 주소가 화이트리스트에 있는지 확인
   */
  async isWhitelisted(address, provider) {
    const contract = this.getReadOnlyContract(provider);
    const status = await contract.whitelisted(address);
    return status;
  },

  /**
   * 화이트리스트에 사용자 추가/제거 (Owner만 가능)
   */
  async setWhitelist(address, status, signer) {
    const contract = this.getContract(signer);
    const tx = await contract.setWhitelist(address, status);
    return tx;
  },

  /**
   * 특정 작품의 가격 조회
   */
  async getSharePrice(id, provider) {
    const contract = this.getReadOnlyContract(provider);
    const price = await contract.sharePrice(id);
    return price;
  },

  /**
   * 사용자의 포트폴리오 조회
   */
  async getUserPortfolio(address, provider) {
    const contract = this.getReadOnlyContract(provider);
    const { 0: ids, 1: balances } = await contract.getUserPortfolio(address);
    return { ids, balances };
  },

  /**
   * 특정 작품의 모든 홀더 정보 조회
   */
  async getAllHolders(id, provider) {
    const contract = this.getReadOnlyContract(provider);
    const { 0: holders, 1: balances } = await contract.getAllHolders(id);
    return { holders, balances };
  },

  /**
   * 작품 구매
   */
  async buyArtworks(ids, amounts, totalPrice, signer) {
    const contract = this.getContract(signer);
    const tx = await contract.buyArtworks(ids, amounts, { value: totalPrice });
    return tx;
  },

  /**
   * 작품 민팅 (Owner만 가능)
   */
  async mintArt(prices, uris, royaltyAddress, feeNumerator, signer) {
    const contract = this.getContract(signer);
    const data = '0x';
    const tx = await contract.mintArt(prices, data, uris, royaltyAddress, feeNumerator);
    return tx;
  },

  /**
   * 작품 메타데이터 URI 조회
   */
  async getTokenURI(id, provider) {
    const contract = this.getReadOnlyContract(provider);
    const uri = await contract.uri(id);
    return uri;
  },
};
