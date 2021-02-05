pragma solidity 0.5.17;

import "./TTokenMock.sol";
import "./DAIMock.sol";

/**
 * @notice This contract represents DAI token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TDAIMock is TTokenMock {
    /* Constructor */
    /**
     * @dev Calls TToken constructor with token details
     * @param lendingPoolAddress the lending pool address.
     * @param settingsAddress the settings address.
     */
    constructor(address lendingPoolAddress, address settingsAddress)
        public
        TTokenMock(address(new DAIMock()), lendingPoolAddress, settingsAddress)
    {}
}