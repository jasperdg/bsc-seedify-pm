export interface SedaConfig {
  coreAddress: string;
}

export const networkConfigs: { [network: string]: SedaConfig } = {
  // Proxy Core Addresses (SEDA mainnet)
  bscTestnet: {
    coreAddress: '0x48bBf8Ed8fDbC156F4DE06D2eBfd13305Cb3C7bA',
  },
  
};
