//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZeroKageERC20 is ERC20{

    constructor(string memory name, string memory symbol, uint256 tokenSupply) ERC20(name, symbol){

        _mint(msg.sender, tokenSupply); // mint 10 million Zero Kage tokens as per ERC 20 standard

    }
}