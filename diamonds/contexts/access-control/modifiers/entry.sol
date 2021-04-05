// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { sto_AccessControl } from "../storage.sol";

abstract contract mod_entry_AccessControl_v1 {
    modifier entry {
        sto_AccessControl.AccessControlLayout storage layout =
            sto_AccessControl.accessControl();
        require(layout.notEntered, "RE_ENTRANCY");
        layout.notEntered = false;
        _;
        layout.notEntered = true;
    }
}
