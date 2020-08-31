// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const { tlrToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMTokenSetCapTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember1 = accounts[2];

    beforeEach('Setup for each test', async () => {
        const settings = await createTestSettingsInstance(Settings);
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeSettings(),
            settings.address
        );
        atmInstance = await Mock.new();
        instance = await TLRToken.new();
        await instance.initialize(
                            "Teller Token",
                            "TLR",
                            18, 
                            10000, 
                            50,
                            atmSettingsInstance.address,
                            atmInstance.address
                        );
    });

    withData({
        _1_basic: [70000, daoAgent, undefined, false],
        _2_invalid_sender: [100000, daoMember1, 'ONLY_PAUSER', true]
    },function(
        newCap,
        sender,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('agent', 'setCap', 'Should or should not be able to set cap correctly', mustFail), async function() {
            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
                false
            );

            try {
                // Invocation
                const result = await instance.setCap(newCap, { from: sender });
                const cap = await instance.cap();
                // Assertions
                assert(!mustFail, 'It should have failed because the sender is invalid');
                assert.equal(
                    cap,
                    newCap,
                    'New supply cap not set!'
                );
                tlrToken
                    .newCap(result)
                    .emitted(newCap);
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(
                    error.reason,
                    expectedErrorMessage
                    );
            }

        });
    });

})