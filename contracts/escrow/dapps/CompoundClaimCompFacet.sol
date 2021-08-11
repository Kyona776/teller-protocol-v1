// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";
import "hardhat/console.sol";
// Libraries
import { LibCompound } from "./libraries/LibCompound.sol";
import { LibEscrow } from "../libraries/LibEscrow.sol";
import { LibLoans } from "../../market/libraries/LibLoans.sol";
// Storage
import { LoanStatus } from "../../storage/market.sol";

// Interfaces
import { IComptroller } from "../../shared/interfaces/IComptroller.sol";

contract CompoundClaimCompFacet is PausableMods, DappMods {
    /**
     * @notice This event is emitted every time Compound redeem is invoked successfully.
     * @param borrower address of the loan borrower.
     * @param loanID loan ID.
     */
    event CompoundClaimed(address indexed borrower, uint256 loanID);

    /**
     * @dev The address of Compound's Comptroler Address Provider on the deployed network
     * @dev example - Compound's Comptroler Address Provider contract address on L1 mainnet or L2 polygon mainnet
     */
    address public immutable COMPTROLLER_ADDRESS_PROVIDER_ADDRESS;

    /**
     * @notice Sets the network relevant address for Compound's Comptroller Address Provider on protocol deployment.
     * @param compComptrollerAddressProvider The immutable address of Compound's Comptroller Address Provider on the deployed network.
     */
    constructor(address compComptrollerAddressProvider) public {
        COMPTROLLER_ADDRESS_PROVIDER_ADDRESS = compComptrollerAddressProvider;
    }

    /**
     * @notice To claim COMP call the {claimComp} function on COMPTROLLER_ADDRESS_PROVIDER_ADDRESS.
     * @param loanID id of the loan being used in the dapp
     */
    function compoundClaimComp(uint256 loanID)
        public
        paused("", false)
        onlyBorrower(loanID)
    {
        address user = LibLoans.loan(loanID).status >= LoanStatus.Closed
            ? msg.sender
            : address(LibEscrow.e(loanID));
        LibEscrow.e(loanID).callDapp(
            address(COMPTROLLER_ADDRESS_PROVIDER_ADDRESS),
            abi.encodeWithSignature("claimComp(address)", user)
        );

        // Add AAVE to escrow token list
        // TODO: get the COMP token (add as immutable constructor variable)
        LibEscrow.tokenUpdated(loanID, address(0));

        emit CompoundClaimed(msg.sender, loanID);
    }

    /**
     * @notice This function calcullates the holder's accrued comp.
     * @param loanID id of the loan being used in the dapp
     */
    function compoundCalculateComp(uint256 loanID)
        public
        view
        returns (uint256)
    {
        IComptroller comptroller = IComptroller(
            COMPTROLLER_ADDRESS_PROVIDER_ADDRESS
        );
        uint256 comp = comptroller.compAccrued(address(LibEscrow.e(loanID)));
        return comp;
    }
}
