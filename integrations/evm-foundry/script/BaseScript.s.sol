// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28 <0.9.0;

import { Script } from "forge-std/Script.sol";

abstract contract BaseScript is Script {
    /// @dev Included to enable compilation of the script without a $ETH_PRIVATE_KEY environment variable.
    string internal constant TEST_MNEMONIC = "test test test test test test test test test test test junk";

    /// @dev The address of the transaction broadcaster.
    address internal broadcaster;

    /// @dev Initializes the transaction broadcaster:
    /// - If $EVM_PRIVATE_KEY is defined, derive address from it.
    /// - Otherwise, derive from $MNEMONIC (or test mnemonic if not set).
    constructor() {
        try vm.envUint("EVM_PRIVATE_KEY") returns (uint256 privateKey) {
            broadcaster = vm.addr(privateKey);
        } catch {
            string memory mnemonic = vm.envOr({ name: "MNEMONIC", defaultValue: TEST_MNEMONIC });
            (broadcaster,) = deriveRememberKey({ mnemonic: mnemonic, index: 0 });
        }
    }

    modifier broadcast() {
        vm.startBroadcast(broadcaster);
        _;
        vm.stopBroadcast();
    }
}
