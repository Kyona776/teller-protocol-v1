// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// contracts
import {
    RolesMods
} from "../../../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../../data.sol";

// Interfaces
import { IAToken } from "../../../../shared/interfaces/IAToken.sol";
import {
    IAaveLendingPool
} from "../../../../shared/interfaces/IAaveLendingPool.sol";
import { TTokenStrategy } from "../TTokenStrategy.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { NumbersLib } from "../../../../shared/libraries/NumbersLib.sol";
import { LibDapps } from "../../../../escrow/dapps/libraries/LibDapps.sol";

// Storage
import "../../token-storage.sol" as TokenStorage;
import "./aave-storage.sol" as AaveStorage;

contract TTokenAaveStrategy_1 is RolesMods, TTokenStrategy {
    function() pure returns (TokenStorage.Store storage)
        private constant tokenStore = TokenStorage.store;

    function() pure returns (AaveStorage.Store storage)
        private constant aaveStore = AaveStorage.store;

    string public constant NAME = "AaveStrategy_1";

    /* External Functions */

    function totalUnderlyingSupply() external override returns (uint256) {
        return
            tokenStore().underlying.balanceOf(address(this)) +
            aaveStore().aToken.balanceOf(address(this));
    }

    /**
     * @notice Rebalances the underlying asset held by the Teller Token.
     *
     * This strategy looks at the ratio of held underlying asset balance and balance deposited into
     * Aave. Based on the store {balanceRatioMin} and {balanceRatioMax} values, will deposit or
     * withdraw to keep the ratio within that range.
     */
    function rebalance() public override {
        (
            uint256 storedBal,
            uint256 aaveBal,
            uint16 storedRatio
        ) = _getBalanceInfo();
        if (storedRatio > aaveStore().balanceRatioMax) {
            // Calculate median ratio to rebalance to
            uint16 medianRatio = (aaveStore().balanceRatioMax +
                aaveStore().balanceRatioMin) / 2;
            uint256 requiredBal = NumbersLib.percent(
                storedBal + aaveBal,
                medianRatio
            );
            uint256 amountToDeposit = storedBal - requiredBal;

            IAaveLendingPool lendingPool = LibDapps.getAaveLendingPool(
                aaveStore().LP_ADDRESS_PROVIDER_ADDRESS
            );

            // Approve Aave lending pool
            SafeERC20.safeIncreaseAllowance(
                tokenStore().underlying,
                address(lendingPool),
                amountToDeposit
            );
            // Deposit into Aave
            lendingPool.deposit(
                address(tokenStore().underlying),
                amountToDeposit,
                address(this),
                0 // TODO get referral code from Aave when applicable
            );

            emit StrategyRebalanced(NAME, _msgSender());
        } else if (storedRatio > aaveStore().balanceRatioMin) {
            // Withdraw tokens from Aave
            _withdraw(0, storedBal, aaveBal);

            emit StrategyRebalanced(NAME, _msgSender());
        }
    }

    /**
     * @notice Rebalances the TToken funds by indicating a minimum {amount} of underlying tokens that must be present
     *  after the call.
     * @notice If the minimum amount is present, no rebalance happens.
     * @param amount Amount of underlying tokens that must be available.
     */
    function withdraw(uint256 amount) external override {
        (uint256 storedBal, uint256 aaveBal, ) = _getBalanceInfo();
        if (storedBal < amount) {
            _withdraw(amount, storedBal, aaveBal);
        }
    }

    /**
     * @dev Gets balances and the current ratio of the underlying asset stored on the TToken.
     */
    function _getBalanceInfo()
        internal
        returns (
            uint256 storedBalance_,
            uint256 aaveBalance_,
            uint16 storedRatio_
        )
    {
        storedBalance_ = tokenStore().underlying.balanceOf(address(this));
        aaveBalance_ = aaveStore().aToken.balanceOf(address(this));
        storedRatio_ = NumbersLib.ratioOf(
            storedBalance_,
            storedBalance_ + aaveBalance_
        );
    }

    /**
     * @dev Rebalances funds stored on the TToken by indicating an extra {amount} to withdraw.
     */
    function _withdraw(
        uint256 amount,
        uint256 storedBal,
        uint256 aaveBal
    ) internal {
        // Calculate amount to rebalance
        uint16 medianRatio = (aaveStore().balanceRatioMax +
            aaveStore().balanceRatioMin) / 2;
        uint256 requiredBal = NumbersLib.percent(
            storedBal + aaveBal - amount,
            medianRatio
        );
        uint256 redeemAmount = requiredBal + amount - storedBal;
        // Withdraw tokens from the Aave lending pool if needed
        IAaveLendingPool lendingPool = LibDapps.getAaveLendingPool(
            aaveStore().LP_ADDRESS_PROVIDER_ADDRESS
        );
        lendingPool.withdraw(
            address(tokenStore().underlying),
            redeemAmount,
            address(this)
        );
    }

    /**
     * @notice Sets the Aave token that should be used to manage the underlying Teller Token asset.
     * @param aTokenAddress Address of the Aave token that has the same underlying asset as the TToken.
     * @param aaveLPAddressProvider The immutable address of Aave's Lending Pool Address Provider on the deployed network.
     * @param balanceRatioMin Percentage indicating the _ limit of underlying token balance should remain on the TToken
     * @param balanceRatioMax Percentage indicating the _ limit of underlying token balance should remain on the TToken
     */
    function init(
        address aTokenAddress,
        address aaveLPAddressProvider,
        uint16 balanceRatioMin,
        uint16 balanceRatioMax
    ) external {
        aaveStore().aToken = IAToken(aTokenAddress);
        aaveStore().LP_ADDRESS_PROVIDER_ADDRESS = aaveLPAddressProvider;
        aaveStore().balanceRatioMin = balanceRatioMin;
        aaveStore().balanceRatioMax = balanceRatioMax;
    }
}
