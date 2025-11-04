// SPDX-License-Identifier: MIT
/**
 * NOTICE: This is an example contract demonstrating a prediction market using SEDA price feeds.
 * It is for educational purposes only and should not be used in production.
 */

pragma solidity ^0.8.28;

import {PriceFeed} from "./PriceFeed.sol";

/**
 * @title MyMarket
 * @author SEDA Hackathon Team
 * @notice A prediction market that settles based on whether a price is above or below a strike price at expiry
 * @dev This contract uses the PriceFeed contract to fetch the settlement price
 */
contract MyMarket {
    /// @notice The PriceFeed contract used for price data
    PriceFeed public immutable PRICE_FEED;

    /// @notice The strike price that determines market settlement
    uint128 public immutable STRIKE_PRICE;

    /// @notice The timestamp when the market expires
    uint256 public immutable EXPIRY_TIME;

    /// @notice Whether the market has been settled
    bool public isSettled;

    /// @notice The settlement price fetched at expiry
    uint128 public settlementPrice;

    /// @notice The timestamp of the answer
    uint64 public answerTimestamp;

    /// @notice Whether the market settled above the strike price
    bool public settledAboveStrike;

    /// @notice Emitted when the market is settled
    event MarketSettled(uint128 settlementPrice, bool aboveStrike, uint256 timestamp);

    /// @notice Thrown when trying to settle before expiry
    error MarketNotExpired();

    /// @notice Thrown when trying to settle an already settled market
    error MarketAlreadySettled();

    /// @notice Thrown when the price feed returns zero (no consensus)
    error InvalidSettlementPrice();

    /// @notice Thrown when expiry time is not in the future
    error ExpiryMustBeInFuture();

    /// @notice Thrown when strike price is zero
    error StrikePriceMustBePositive();

    /// @notice Thrown when the answer is out of date
    error AnswerOutDated();

    /**
     * @notice Creates a new prediction market
     * @param _priceFeed Address of the PriceFeed contract
     * @param _strikePrice The strike price for settlement (e.g., 500 USDC = 500 * 10^6)
     * @param _expiryTime The Unix timestamp when the market expires
     */
    constructor(address _priceFeed, uint128 _strikePrice, uint256 _expiryTime) {
        if (_strikePrice == 0) {
            revert StrikePriceMustBePositive();
        }
        
        PRICE_FEED = PriceFeed(_priceFeed);
        STRIKE_PRICE = _strikePrice;
        EXPIRY_TIME = _expiryTime;
        isSettled = false;
    }

    /**
     * @notice Settles the market by fetching the price from PriceFeed
     * @dev Can only be called after expiry time has passed
     * @return settled Whether the market settled above the strike price
     */
    function settleMarket() external returns (bool settled) {
        if (block.timestamp < EXPIRY_TIME) {
            revert MarketNotExpired();
        }

        if (isSettled) {
            revert MarketAlreadySettled();
        }

        // Fetch the latest price from the PriceFeed
        (settlementPrice, answerTimestamp) = PRICE_FEED.latestAnswer();

        if (answerTimestamp < EXPIRY_TIME) {
            revert AnswerOutDated();
        }

        if (settlementPrice == 0 || answerTimestamp == 0) {
            revert InvalidSettlementPrice();
        }

        // Determine if price is above or below strike
        settledAboveStrike = settlementPrice > STRIKE_PRICE;
        isSettled = true;

        emit MarketSettled(settlementPrice, settledAboveStrike, block.timestamp);

        return settledAboveStrike;
    }

    /**
     * @notice Returns whether the market has expired
     * @return expired True if current time is past expiry time
     */
    function hasExpired() public view returns (bool expired) {
        return block.timestamp >= EXPIRY_TIME;
    }

    /**
     * @notice Returns the time remaining until expiry
     * @return timeRemaining Seconds until expiry (0 if already expired)
     */
    function timeUntilExpiry() public view returns (uint256 timeRemaining) {
        if (block.timestamp >= EXPIRY_TIME) {
            return 0;
        }
        return EXPIRY_TIME - block.timestamp;
    }

}