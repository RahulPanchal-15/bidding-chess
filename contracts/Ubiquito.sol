//SPDX-License-Identifier: RahulPanchal-15
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Ubiquito is ERC20Burnable {
    constructor(uint256 initialSupply) ERC20("UBIQUITO ", "UBI") {
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}
