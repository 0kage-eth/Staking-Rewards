//SPDX-License-Identifier:MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Contract developed by 0Kage (https://github.com/0kage-eth/Staking-Rewards)

/**
 * @notice ERC 20 implementation for rewards token rKAGE (rewards Kage)
 * @dev using openzeppelin library for ERC20 contracts
 */

contract r0Kage is ERC20 {
    constructor(uint256 tokenSupply) ERC20("Rewards 0KAGE", "r0KAGE") {
        _mint(msg.sender, tokenSupply); // 1 million tokens minted to the owner
    }
}
