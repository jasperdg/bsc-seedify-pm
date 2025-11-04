<p align="center">
  <a href="https://seda.xyz/">
    <img width="90%" alt="seda-protocol" src="https://raw.githubusercontent.com/sedaprotocol/.github/refs/heads/main/images/banner.png">
  </a>
</p>

<h1 align="center">
  SEDA Hardhat Integration
</h1>

A TypeScript-based starter kit for connecting SEDA Oracle Programs to EVM-compatible blockchains using Hardhat. This integration features:

- **PriceFeed contract**: Demonstrates how to create and retrieve data requests from the SEDA network
- **MyMarket contract**: A prediction market that settles based on price data from PriceFeed after expiry

> [!IMPORTANT]
> The **contracts are examples** designed for educational purposes. They demonstrate basic SEDA integration patterns but should be modified for production use.

## Prerequisites

Before using this integration, you must:s

1. **Deploy an Oracle Program** to the SEDA network (see the [main README](../../README.md))
2. **Get your Oracle Program ID** from the deployment
3. **Set up your environment** with the required variables

## Quick Start

### 1. Install Dependencies

```sh
cd integrations/evm-hardhat
bun install
```

### 2. Environment Setup

Create a `.env` file with the required variables:

```bash
# Required: Your deployed Oracle Program ID
ORACLE_PROGRAM_ID=YOUR_ORACLE_PROGRAM_ID

# Required: Your EVM private key for deployment
EVM_PRIVATE_KEY=YOUR_EVM_PRIVATE_KEY

# Optional: For contract verification
BASE_SEPOLIA_ETHERSCAN_API_KEY=YOUR_BASESCAN_API_KEY
```

> [!CAUTION]
> You must provide a valid EVM private key in your .env file to deploy and interact with contracts. Never share or commit your private key. Use a dedicated testing account with minimal funds.

Alternatively, this project also supports `dotenvx` for environment variable management with built-in secret encryption. See the [dotenvx documentation](https://dotenvx.com) for usage details.

### 3. Deploy the Contracts

> [!IMPORTANT]
> The deploy task deploys both PriceFeed and MyMarket contracts. PriceFeed is a destination contract that interacts with your deployed Oracle Program, and MyMarket is a prediction market that uses PriceFeed data for settlement.

```sh
# Deploy to Base Sepolia
bunx hardhat pricefeed deploy --network baseSepolia --verify

# Deploy with custom parameters
bunx hardhat pricefeed deploy --oracle-program-id YOUR_ORACLE_PROGRAM_ID --core-address YOUR_CORE_ADDRESS --force
```

To deploy to a specific network, use the `--network` flag followed by the network name (e.g. baseSepolia, bscTestnet). You can also add the `--verify` flag to automatically verify both contracts' source code on the network's block explorer after deployment.

By default, the deployment uses environment variables defined in your `.env` file, but you can override these with command-line parameters. MyMarket constructor arguments (strike price and expiry) are hardcoded in `tasks/deploy.ts`.

> [!NOTE]
> The project includes a `seda.config.ts` file that contains SEDA-specific configurations including pre-configured core addresses for supported networks. You can modify this file to add support for additional networks or customize existing configurations.

### 4. Interact with Your Contracts

**Create a Data Request (PriceFeed):**
```sh
bunx hardhat pricefeed transmit --network baseSepolia
```

**Fetch the Latest Result (PriceFeed):**
```sh
bunx hardhat pricefeed latest --network baseSepolia
```

**Settle the Market (MyMarket):**
```sh
bunx hardhat pricefeed settle --network baseSepolia
```

> [!NOTE]
> The settle task can only be executed after the MyMarket contract has expired. It fetches the latest price from PriceFeed and determines if the price settled above or below the strike price. The market can only be settled once.

## Project Structure

This project follows the structure of a typical Hardhat project:

- **contracts/**: Contains the Solidity contracts (PriceFeed and MyMarket).
- **tasks/**: Hardhat tasks for interacting with the contracts (deploy, transmit, latest, settle).
- **test/**: Test files for the contracts.
- **seda.config.ts**: SEDA network configurations with deployed Core Addresses.
- **deployments/**: JSON file containing deployed contract addresses per network.

## Understanding the Integration

### Oracle Program vs Destination Contract

- **Oracle Program** (Rust/WASM): Fetches data from external sources and processes it
- **Destination Contract** (Solidity): Requests data from the Oracle Program and uses the results

The PriceFeed contract is a **destination contract** that:
1. Creates data requests on the SEDA network using your Oracle Program
2. Retrieves processed results from the Oracle Program
3. Makes the data available to other smart contracts

### Example Flow

1. **Deploy Oracle Program** → Get `ORACLE_PROGRAM_ID`
2. **Deploy Contracts** → Deploys PriceFeed (using `ORACLE_PROGRAM_ID`) and MyMarket (using PriceFeed address)
3. **Call `transmit()`** → Creates a data request on SEDA network
4. **Call `latestAnswer()`** → Retrieves the processed result
5. **After expiry, call `settle()`** → Settles the market based on the latest price

## MyMarket Contract

The MyMarket contract demonstrates a practical use case for oracle data: a prediction market that automatically settles based on price data.

### How It Works

1. **Deployment**: MyMarket is deployed with:
   - PriceFeed contract address
   - Strike price (e.g., $500 BNB)
   - Expiry time (e.g., 7 days from deployment)

2. **Before Expiry**: The market waits for the expiry time
   - Users can check if the market has expired with `hasExpired()`
   - Users can check time remaining with `timeUntilExpiry()`

3. **After Expiry**: Anyone can call `settleMarket()`:
   - Fetches the latest price from PriceFeed
   - Compares it against the strike price
   - Records whether price settled above or below strike
   - Validates that the price timestamp is after expiry
   - Can only be settled once

4. **Settlement Results**:
   - `settlementPrice`: The price used for settlement
   - `settledAboveStrike`: Boolean indicating if price > strike price
   - `answerTimestamp`: When the price data was recorded
   - `isSettled`: Whether the market has been settled

### Key Features

- **Timestamp Validation**: Ensures the price data is from after the expiry time
- **One-Time Settlement**: Cannot be settled multiple times
- **Transparent Results**: All settlement data is publicly accessible on-chain
- **Configurable Parameters**: Strike price and expiry are set at deployment (hardcoded in `tasks/deploy.ts`)

## Testing

```sh
# Compile contracts
bun run compile

# Run tests
bun run test
```

## Development

```sh
# Format code
bun run format

# Lint code
bun run lint
```

## Next Steps

For advanced topics, different oracle programs, and customization ideas, see the [main integrations README](../README.md#whats-next).

## Resources

- [SEDA Protocol Documentation](https://docs.seda.xyz)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Building Oracle Programs Guide](https://docs.seda.xyz/home/for-developers/building-an-oracle-program)
- [SEDA SDK Documentation](https://github.com/sedaprotocol/seda-sdk)

## License

Contents of this repository are open source under [MIT License](../../LICENSE).
