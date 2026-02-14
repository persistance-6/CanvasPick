import "dotenv/config"; // 보안을 위해 환경변수 사용

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20", // OpenZeppelin 5.0 이상 사용 시 0.8.20 추천
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 로컬 테스트용 (Codespace 터미널에서 npx hardhat node 실행 시 사용)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // 추후 테스트넷 배포 시 아래 주석을 해제하고 설정
    /*
    sepolia: {
      url: process.env.QUICKNODE_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    */
  },
};
