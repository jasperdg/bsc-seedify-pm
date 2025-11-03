import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import dotenvx from '@dotenvx/dotenvx';

// PriceFeed Tasks
import './tasks';

dotenvx.config();

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    bscTestnet: {
      accounts: process.env.EVM_PRIVATE_KEY ? [process.env.EVM_PRIVATE_KEY] : [],
      url: 'https://bnb-testnet.api.onfinality.io/public',
      chainId: 97,

    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
    customChains: [
      {
        network: 'bscTestnet',
        chainId: 97,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=97',
          browserURL: 'https://testnet.bscscan.com',
        },
      },
    ],
  },
};

export default config;
