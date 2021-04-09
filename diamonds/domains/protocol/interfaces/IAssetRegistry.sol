// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAssetRegistry {
    function getAsset(string memory asset) external view returns (address);

    function assetInfo(address asset) external view returns (bool isCToken);
}