// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/pool-ticket.sol";

abstract contract ent_withdraw_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_pool_ticket
{
    /**
        @notice This event is emitted every time Pool Together withdrawInstantlyFrom is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param ticketAddress pool ticket token address.
        @param amount amount of tokens to Redeem.
        @param tokenBalance underlying token balance after Redeem.
        @param creditBalanceAfter pool together credit after depositing.
     */
    event PoolTogetherWithdrawal(
        address indexed tokenAddress,
        address indexed ticketAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 creditBalanceAfter
    );

    /**
        @notice This function withdraws the users funds from a Pool Together Prize Pool.
        @param tokenAddress address of the token.
        @param amount The amount of tokens to withdraw.
    */
    function withdraw(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        PrizePoolInterface prizePool = _getPrizePool(tokenAddress);

        address ticketAddress = _getTicketAddress(tokenAddress);
        uint256 balanceBefore = _balanceOf(ticketAddress);

        (
            uint256 maxExitFee, /* uint256 burnedCredit */

        ) =
            prizePool.calculateEarlyExitFee(
                address(this),
                ticketAddress,
                amount
            );
        prizePool.withdrawInstantlyFrom(
            address(this),
            amount,
            ticketAddress,
            maxExitFee
        );

        uint256 balanceAfter = _balanceOf(ticketAddress);
        require(balanceAfter < balanceBefore, "WITHDRAW_ERROR");

        _tokenUpdated(address(ticketAddress));
        _tokenUpdated(tokenAddress);

        emit PoolTogetherWithdrawal(
            tokenAddress,
            ticketAddress,
            amount,
            _balanceOf(tokenAddress),
            balanceAfter
        );
    }
}

abstract contract ent_withdraw is ent_withdraw_v1 {}
