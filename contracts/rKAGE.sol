//SPDX-License-Identifier:MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice ERC 20 implementation for rewards token rKAGE
 * @dev using openzeppelin library for ERC20 contract
 */

contract rKageERC20 is ERC20{

    constructor(string memory name, string memory symbol, uint256 tokenSupply) ERC20(name, symbol){
        _mint(msg.sender, tokenSupply); // 1 million tokens minted to the owner
    }

}