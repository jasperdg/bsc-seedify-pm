import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MyMarket } from '../typechain-types';
import { priceFeedScope } from '.';

/**
 * Task: Settles the MyMarket contract by fetching the price from PriceFeed.
 * This can only be called after the market has expired.
 */
priceFeedScope
  .task('settle', 'Settles the MyMarket contract after expiry')
  .setAction(async (_, hre) => {
    try {
      // Create network key with name and chainId
      const chainId = hre.network.config.chainId || 0;
      const networkKey = `${hre.network.name}-${chainId}`;

      // Read deployment info
      const deploymentsDir = path.join(__dirname, '../deployments');
      const deploymentFile = path.join(deploymentsDir, 'addresses.json');

      if (!fs.existsSync(deploymentFile)) {
        throw new Error('No deployments found. Please deploy contracts first.');
      }

      const allDeployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      const deployment = allDeployments[networkKey];

      if (!deployment) {
        throw new Error(`No deployment found for network ${networkKey}`);
      }

      if (!deployment.myMarketAddress) {
        throw new Error('MyMarket contract not deployed. Please deploy with --deployMarket flag.');
      }

      const myMarketAddress = deployment.myMarketAddress;
      console.log(`\nSettling MyMarket at: ${myMarketAddress}`);

      // Get MyMarket contract instance
      const MyMarketFactory = await hre.ethers.getContractFactory('MyMarket');
      const myMarket = MyMarketFactory.attach(myMarketAddress) as MyMarket;

      // Check if market has expired
      const hasExpired = await myMarket.hasExpired();
      if (!hasExpired) {
        const timeRemaining = await myMarket.timeUntilExpiry();
        const expiryDate = new Date(Date.now() + Number(timeRemaining) * 1000);
        throw new Error(
          `Market has not expired yet. Expires in ${timeRemaining} seconds (${expiryDate.toUTCString()})`,
        );
      }

      // Check if already settled
      const isSettled = await myMarket.isSettled();
      if (isSettled) {
        console.log('\n⚠️  Market is already settled!');
        const settlementPrice = await myMarket.settlementPrice();
        const settledAboveStrike = await myMarket.settledAboveStrike();
        const strikePrice = await myMarket.STRIKE_PRICE();
        const answerTimestamp = await myMarket.answerTimestamp();

        console.log(`\nSettlement Details:`);
        console.log(`- Settlement Price: ${settlementPrice.toString()} wei`);
        console.log(`- Strike Price: ${strikePrice.toString()} wei`);
        console.log(`- Settled Above Strike: ${settledAboveStrike ? 'YES ✅' : 'NO ❌'}`);
        console.log(`- Answer Timestamp: ${new Date(Number(answerTimestamp) * 1000).toUTCString()}`);
        return;
      }

      console.log('\n⏳ Settling market...');

      // Settle the market
      const tx = await myMarket.settleMarket();
      console.log(`Transaction hash: ${tx.hash}`);

      const receipt = await tx.wait();
      if (receipt) {
        console.log(`✅ Market settled! Gas used: ${receipt.gasUsed.toString()}`);
      } else {
        console.log('✅ Market settled!');
      }

      // Get settlement details
      const settlementPrice = await myMarket.settlementPrice();
      const settledAboveStrike = await myMarket.settledAboveStrike();
      const strikePrice = await myMarket.STRIKE_PRICE();
      const answerTimestamp = await myMarket.answerTimestamp();

      console.log(`\n=== Settlement Results ===`);
      console.log(`Settlement Price: ${settlementPrice.toString()} wei`);
      console.log(`Strike Price: ${strikePrice.toString()} wei`);
      console.log(`Settled Above Strike: ${settledAboveStrike ? 'YES ✅' : 'NO ❌'}`);
      console.log(`Answer Timestamp: ${new Date(Number(answerTimestamp) * 1000).toUTCString()}`);

      if (settledAboveStrike) {
        console.log('\n🎉 Market settled ABOVE strike price!');
      } else {
        console.log('\n📉 Market settled BELOW strike price.');
      }
    } catch (error) {
      console.error('Settlement failed:', error);
      process.exit(1);
    }
  });

