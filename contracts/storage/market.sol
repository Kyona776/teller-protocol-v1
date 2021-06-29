// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External Libraries
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Teller Libraries
import "../shared/libraries/NumbersList.sol";
import { Verifier } from "../market/cra/verifier.sol";

// Teller Interfaces
import { ILoansEscrow } from "../escrow/escrow/ILoansEscrow.sol";
import { ICollateralEscrow } from "../market/collateral/ICollateralEscrow.sol";
import { ITToken } from "../lending/ttoken/ITToken.sol";

// DEPRECATED
struct LoanTerms {
    // Max size the loan max be taken out with
    uint256 maxLoanAmount;
    // The timestamp at which the loan terms expire, after which if the loan is not yet active, cannot be taken out
    uint32 termsExpiry;
}

enum LoanStatus {
    NonExistent,
    TermsSet,
    Active,
    Closed,
    Liquidated
}

struct Loan {
    // Account that owns the loan
    address payable borrower;
    // The asset lent out for the loan
    address lendingToken;
    // The token used as collateral for the loan
    address collateralToken;
    // The total amount of the loan size taken out
    uint256 borrowedAmount;
    // The id of the loan for internal tracking
    uint128 id;
    // How long in seconds until the loan must be repaid
    uint32 duration;
    // The timestamp at which the loan became active
    uint32 loanStartTime;
    // The interest rate given for repaying the loan
    uint16 interestRate;
    // Ratio used to determine amount of collateral required based on the collateral asset price
    uint16 collateralRatio;
    // The status of the loan
    LoanStatus status;
}

struct LoanDebt {
    // The total amount of the loan taken out by the borrower, reduces on loan repayments
    uint256 principalOwed;
    // The total interest owed by the borrower for the loan, reduces on loan repayments
    uint256 interestOwed;
}

/**
 * @notice our loan request to be sent to our borrow function to verify Proof with the witness,
   verify our signature data, process the market score to get our interest rate, then create a loan
   if market score is sufficient 
 * @param request the user request containing all the necessary information for our loan request
 * @param marketId the market we are borrowing a loan from
 * @param proof the proof to verify 
 * @param witness the witness that contains our identifier, score and commitment data 
 * @param signatureData the signatureData that is used to validate against the commitments we construct
 */
struct LoanRequest {
    LoanUserRequest request;
    address marketHandlerAddress;
    Verifier.Proof snarkProof;
    uint256[26] snarkWitnesses;
    DataProviderSignature[] dataProviderSignatures;
}

/**
 * @notice Borrower request object to take out a loan
 * @param borrower The wallet address of the borrower
 * @param assetAddress The address of the asset for the requested loan
 * @param assetAmount The amount of tokens requested by the borrower for the loan
 * @param collateralAsset the asset provided by the user as collateral to the loan
 * @param collateralAmount the amount of the above collateral
 * @param duration The length of time in seconds that the loan has been requested for
 */
struct LoanUserRequest {
    address payable borrower;
    address assetAddress;
    uint256 assetAmount;
    address collateralAsset;
    uint256 collateralAmount;
    uint32 duration;
}

/**
 * @notice Borrower response object to take out a loan
 * @param signer The wallet address of the signer validating the interest request of the lender
 * @param assetAddress The address of the asset for the requested loan
 * @param maxLoanAmount The largest amount of tokens that can be taken out in the loan by the borrower
 * @param responseTime The timestamp at which the response was sent
 * @param interestRate The signed interest rate generated by the signer's Credit Risk Algorithm (CRA)
 * @param collateralRatio The ratio of collateral to loan amount that is generated by the signer's Credit Risk Algorithm (CRA)
 * @param signature The signature generated by the signer in the format of the above Signature struct
 */
struct LoanConsensusResponse {
    address signer;
    address assetAddress;
    uint256 maxLoanAmount;
    uint32 responseTime;
    uint16 interestRate;
    uint16 collateralRatio;
    Signature signature;
}

/**
 * @notice Represents a user signature
 * @param v The recovery identifier represented by the last byte of a ECDSA signature as an int
 * @param r The random point x-coordinate of the signature respresented by the first 32 bytes of the generated ECDSA signature
 * @param s The signature proof represented by the second 32 bytes of the generated ECDSA signature
 */
struct Signature {
    uint8 v;
    bytes32 r;
    bytes32 s;
}

/**
 * @notice It represents signature data from our data providers
 * @param signature signature from our data provider
 * @param signedAt the timed they signed at
 */
struct DataProviderSignature {
    Signature signature;
    uint256 signedAt;
}

/**
 * @notice It represents the provider configuration respective to a market
 * @param admin a mapping of all admins in a provider configuration
 * @param signer a mapping of all accepted signers in a provider configuration
 * @param maxAge a uint used as a check to see if current blocktime stamp - maxAge is less than
 * the moment the provider signed at
 */
struct ProviderConfig {
    mapping(address => bool) admin;
    mapping(address => bool) signer;
    uint32 maxAge;
}

/**
 * @notice It represents the information needed from a market when users request loans from the
 * respective market
 * @param maxInterestRate the max interest rate in a market
 * @param maxCollateralRatio the max collateral ratio in a market
 * @param maxLoanAmount the max loan amount in a market
 */
struct MarketInformation {
    uint16 maxInterestRate;
    uint16 maxCollateralRatio;
    uint256 maxLoanAmount;
}

/**
 * @notice it represents information of a market configuration which contains the admin and provider configurations
 * @param admin a mapping of addresses to an administrator
 * @param providerConfigs a mapping of ID to provider config
 */
struct MarketConfig {
    mapping(address => bool) admin;
    MarketInformation marketInformation;
}

struct MarketStorage {
    // Holds the index for the next loan ID
    Counters.Counter loanIDCounter;
    // Maps loanIDs to loan data
    mapping(uint256 => Loan) loans;
    // Maps loanID to loan debt (total owed left)
    mapping(uint256 => LoanDebt) loanDebt;
    // Maps loanID to loan terms
    mapping(uint256 => LoanTerms) _loanTerms; // DEPRECATED: DO NOT REMOVE
    // Maps loanIDs to escrow address to list of held tokens
    mapping(uint256 => ILoansEscrow) loanEscrows;
    // Maps loanIDs to list of tokens owned by a loan escrow
    mapping(uint256 => EnumerableSet.AddressSet) escrowTokens;
    // Maps collateral token address to a LoanCollateralEscrow that hold collateral funds
    mapping(address => ICollateralEscrow) collateralEscrows;
    // Maps accounts to owned loan IDs
    mapping(address => uint128[]) borrowerLoans;
    // Maps lending token to overall amount of interest collected from loans
    mapping(address => ITToken) tTokens;
    // Maps lending token to list of signer addresses who are only ones allowed to verify loan requests
    mapping(address => EnumerableSet.AddressSet) signers;
    // Maps lending token to list of allowed collateral tokens
    mapping(address => EnumerableSet.AddressSet) collateralTokens;
}

bytes32 constant MARKET_STORAGE_POS = keccak256("teller.market.storage");

library MarketStorageLib {
    function store() internal pure returns (MarketStorage storage s) {
        bytes32 pos = MARKET_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
