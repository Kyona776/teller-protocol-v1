pragma solidity 0.5.17;

// Interfaces
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorInterface.sol";
import "../../interfaces/SettingsInterface.sol";

contract BaseChainlinkPairAggregator {
    SettingsInterface public settings;
}