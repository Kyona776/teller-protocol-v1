// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { OwnerSet } from "../data.sol";
import "../storage/owner.sol";

abstract contract int_transferOwner_AccessControl_v1 is
    sto_AccessControl_Owner
{
    function _transferOwner(address owner) internal {
        require(
            accessControlOwnerStore().owner == msg.sender,
            "AccessControl: cannot transfer; not owner"
        );
        accessControlOwnerStore().owner = owner;
        emit OwnerTransferred(owner, msg.sender);
    }
}

abstract contract int_transferOwner_AccessControl is
    int_transferOwner_AccessControl_v1
{}
