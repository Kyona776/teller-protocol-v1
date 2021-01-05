pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "./AddressLib.sol";

/**
    @notice Utility library of inline functions on the AssetSettings struct.

    @author develop@teller.finance
 */
library AssetSettingsLib {
    using AddressLib for address;
    using Address for address;

    /**
        @notice This struct manages the asset settings in the platform.
        @param tokenAddresses the token addresses associated to the asset. 
        @param maxLoanAmount max loan amount configured for the asset.
     */
    struct AssetSettings {
        // It represents a mapping of the token name and the tokenAddress or 0x0.
        // address tokenAddress;
        mapping(bytes32 => address) tokenAddresses;
        // It represents the maximum loan amount to borrow.
        uint256 maxLoanAmount;
        // It represents if the setting has been initialized.
        bool initialized;
    }

    /**
        @notice It initializes the struct instance with the given parameters.
        @param maxLoanAmount the initial max loan amount.
     */
    function initialize(AssetSettings storage self, uint256 maxLoanAmount) internal {
        requireNotExists(self);
        require(maxLoanAmount > 0, "INIT_MAX_AMOUNT_REQUIRED");
        self.maxLoanAmount = maxLoanAmount;
        self.initialized = true;
    }

    /**
        @notice Checks whether the current asset settings exists or not.
        @dev It throws a require error if the asset settings already exists.
        @param self the current asset settings.
     */
    function requireNotExists(AssetSettings storage self) internal view {
        require(!exists(self), "ASSET_SETTINGS_ALREADY_EXISTS");
    }

    /**
        @notice Checks whether the current asset settings exists or not.
        @dev It throws a require error if the asset settings doesn't exist.
        @param self the current asset settings.
     */
    function requireExists(AssetSettings storage self) internal view {
        require(exists(self), "ASSET_SETTINGS_NOT_EXISTS");
    }

    /**
        @notice Tests whether the current asset settings exists or not.
        @param self the current asset settings.
        @return true if the current settings exists.
     */
    function exists(AssetSettings storage self) internal view returns (bool) {
        return self.initialized;
    }

    /**
        @notice Tests whether a given amount is greater than the current max loan amount.
        @param self the current asset settings.
        @param amount to test.
        @return true if the given amount is greater than the current max loan amount. Otherwise it returns false.
     */
    function exceedsMaxLoanAmount(AssetSettings storage self, uint256 amount)
        internal
        view
        returns (bool)
    {
        requireExists(self);
        return amount > self.maxLoanAmount;
    }

    /**
        @notice It updates the cToken address.
        @param self the current asset settings.
        @param newCTokenAddress the new cToken address to set.
     */
    function updateCTokenAddress(AssetSettings storage self, address newCTokenAddress)
        internal
    {
        requireExists(self);
        require(
            self.tokenAddresses[keccak256("CTokenAddress")] != newCTokenAddress,
            "NEW_CTOKEN_ADDRESS_REQUIRED"
        );
        self.tokenAddresses[keccak256("CTokenAddress")] = newCTokenAddress;
    }

    /**
        @notice It updates the a token address for a given protocol name.
        @param self the current asset settings.
        @param tokenName the name of the token to update the address for
        @param newTokenAddress the new Token address to set.
     */
    function updateTokenAddress(
        AssetSettings storage self,
        bytes32 tokenName,
        address newTokenAddress
    ) internal {
        requireExists(self);
        require(
            self.tokenAddresses[tokenName] != newTokenAddress,
            "NEW_TOKEN_ADDRESS_REQUIRED"
        );
        self.tokenAddresses[tokenName] = newTokenAddress;
    }

    /**
        @notice It updates the address for a given token
        @param 
     */

    /**
        @notice It updates the max loan amount.
        @param self the current asset settings.
        @param newMaxLoanAmount the new max loan amount to set.
     */
    function updateMaxLoanAmount(AssetSettings storage self, uint256 newMaxLoanAmount)
        internal
    {
        requireExists(self);
        require(self.maxLoanAmount != newMaxLoanAmount, "NEW_MAX_LOAN_AMOUNT_REQUIRED");
        require(newMaxLoanAmount > 0, "MAX_LOAN_AMOUNT_NOT_ZERO");
        self.maxLoanAmount = newMaxLoanAmount;
    }
}
