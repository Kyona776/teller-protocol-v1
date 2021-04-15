// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ILoansEscrow } from "./ILoansEscrow.sol";
import { DappData } from "../../storage/market.sol";

contract LoansEscrow_V1 is OwnableUpgradeable, ILoansEscrow {
    address public operator;

    modifier onlyOperator {
        require(_msgSender() == operator, "Teller: not lp escrow operator");
        _;
    }

    function init(address _operator) external override {
        OwnableUpgradeable.__Ownable_init();

        operator = _operator;
    }

    function callDapp(DappData calldata dappData)
        external
        override
        onlyOperator
    {
        executeStrategy();
    }

    function claimTokens() external override onlyOperator {}

    function executeStrategy() public override {}
}