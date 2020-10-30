// JS Libraries
const withData = require('leche').withData

const { t, NULL_ADDRESS, ACTIVE } = require('../utils/consts')
const { loans } = require('../utils/events')
const { createLoanTerms } = require('../utils/structs')
const { createTestSettingsInstance } = require('../utils/settings-helper')
const { createLoan } = require('../utils/loans')

const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder')
const ChainlinkAggregatorEncoder = require('../utils/encoders/ChainlinkAggregatorEncoder')
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder')

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol')
const LINKMock = artifacts.require('./mock/token/LINKMock.sol')

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol')
const Loans = artifacts.require('./mock/base/TokenCollateralLoansMock.sol')

contract('TokenCollateralLoansWithdrawCollateralTest', function (accounts) {
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3)
  const chainlinkAggregatorEncoder = new ChainlinkAggregatorEncoder(web3)
  const lendingPoolInterfaceEncoder = new LendingPoolInterfaceEncoder(web3)
  const collateralTokenOwner = accounts[9]
  let instance
  let chainlinkAggregatorInstance
  let lendingTokenInstance
  let lendingPoolInstance
  let loanTermsConsInstance
  let settingsInstance

  beforeEach('Setup for each test', async () => {
    lendingTokenInstance = await Mock.new()
    lendingPoolInstance = await Mock.new()
    loanTermsConsInstance = await Mock.new()

    settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        Mock,
        initialize: true,
        onInitialize: async (instance, { chainlinkAggregator }) => {
          chainlinkAggregatorInstance = chainlinkAggregator
        }
      })

    instance = await Loans.new()

    const encodeLendingToken = lendingPoolInterfaceEncoder.encodeLendingToken()
    await lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address)
  })

  withData({
    _1_less_than_allowed: [ 1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 30000, accounts[1], 100, false, undefined ],
    _2_non_borrower: [ 2, accounts[1], 0, 0, 0, 0, 0, 0, 0, accounts[2], 0, true, 'CALLER_DOESNT_OWN_LOAN' ],
    _3_withdraw_zero: [ 3, accounts[1], 0, 0, 1000, 30000, 0, 30000, 30000, accounts[1], 0, true, 'CANNOT_WITHDRAW_ZERO' ]
  }, function (
    loanID,
    loanBorrower,
    loanPrincipalOwed,
    loanInterestOwed,
    loanCollateralRatio,
    loanCollateral,
    tokenDecimals,
    currentTotalCollateral,
    oracleValue,
    borrowerAddress,
    withdrawalAmount,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('user', 'withdrawCollateral', 'Should able to withdraw collateral (tokens).', mustFail), async function () {
      // Setup
      const collateralToken = await LINKMock.new({ from: collateralTokenOwner })
      await instance.initialize(
        lendingPoolInstance.address,
        loanTermsConsInstance.address,
        settingsInstance.address,
        collateralToken.address
      )

      const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0)
      const loan = createLoan({
        id: loanID,
        loanTerms,
        collateral: loanCollateral,
        principalOwed: loanPrincipalOwed,
        interestOwed: loanInterestOwed,
        borrowedAmount: loanTerms.maxLoanAmount,
        status: ACTIVE,
      });
      await instance.setLoan(loan)
      await instance.setTotalCollateral(currentTotalCollateral)

      await collateralToken.mint(instance.address, currentTotalCollateral, { from: collateralTokenOwner })

      // encode current token price
      await chainlinkAggregatorInstance.givenMethodReturnUint(
        chainlinkAggregatorEncoder.encodeValueFor(),
        oracleValue.toString()
      )

      // encode token decimals
      const encodeDecimals = erc20InterfaceEncoder.encodeDecimals()
      await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals)

      const initialContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)

      try {
        // Invocation
        const result = await instance.withdrawCollateral(withdrawalAmount.toString(), loanID, { from: borrowerAddress })

        // Assertions
        const finalTotalCollateral = await instance.totalCollateral()
        const finalContractCollateralTokenBalance = await collateralToken.balanceOf(instance.address)

        const loanInfo = await instance.loans(loanID)

        loans
          .collateralWithdrawn(result)
          .emitted(loanID, loanBorrower, withdrawalAmount)

        assert.equal(parseInt(loanInfo.collateral), (loanCollateral - withdrawalAmount))
        assert.equal(currentTotalCollateral - withdrawalAmount, parseInt(finalTotalCollateral))
        assert.equal(parseInt(initialContractCollateralTokenBalance) - withdrawalAmount, parseInt(finalContractCollateralTokenBalance))
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.reason)
      }
    })
  })

  withData({
    _1_not_enough_balance: [ true, 4917, 1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 30000, accounts[1], 4918, true, 'NOT_ENOUGH_TOKENS_BALANCE' ],
    _2_transfer_fail: [ false, 4918, 1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 30000, accounts[1], 100, true, 'TOKENS_TRANSFER_FAILED' ],
    _3_too_much_collateral: [ true, 4918, 1, accounts[1], 10000000, 2564000, 5410, 40000, 18, 65432, 30000, accounts[1], 100000, true, 'COLLATERAL_AMOUNT_TOO_HIGH' ]
  }, function (
    transferResult,
    currentBalance,
    loanID,
    loanBorrower,
    loanPrincipalOwed,
    loanInterestOwed,
    loanCollateralRatio,
    loanCollateral,
    tokenDecimals,
    currentTotalCollateral,
    oracleValue,
    borrowerAddress,
    withdrawalAmount,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('user', 'withdrawCollateral#2', 'Should able (or not) to withdraw collateral (tokens).', false), async function () {
      // Setup
      const collateralToken = await Mock.new()
      await instance.initialize(
        lendingPoolInstance.address,
        loanTermsConsInstance.address,
        settingsInstance.address,
        collateralToken.address
      )

      const loanTerms = createLoanTerms(loanBorrower, NULL_ADDRESS, 0, loanCollateralRatio, 0, 0)
      const loan = createLoan({
        id: loanID,
        loanTerms,
        collateral: loanCollateral,
        principalOwed: loanPrincipalOwed,
        interestOwed: loanInterestOwed,
        borrowedAmount: loanTerms.maxLoanAmount,
        status: ACTIVE,
      });
      await instance.setLoan(loan)
      await instance.setTotalCollateral(currentTotalCollateral)

      // encode balance of
      const encodeBalanceOf = erc20InterfaceEncoder.encodeBalanceOf()
      await collateralToken.givenMethodReturnUint(encodeBalanceOf, currentBalance)
      // encode transfer result
      const encodeTransfer = erc20InterfaceEncoder.encodeTransfer()
      await collateralToken.givenMethodReturnBool(encodeTransfer, transferResult)
      // encode current token price
      await chainlinkAggregatorInstance.givenMethodReturnUint(
        chainlinkAggregatorEncoder.encodeValueFor(),
        oracleValue.toString()
      )
      // encode token decimals
      const encodeDecimals = erc20InterfaceEncoder.encodeDecimals()
      await lendingTokenInstance.givenMethodReturnUint(encodeDecimals, tokenDecimals)
      try {
        // Invocation
        const result = await instance.withdrawCollateral(withdrawalAmount.toString(), loanID, { from: borrowerAddress })

        // Assertions
        loans
          .collateralWithdrawn(result)
          .emitted(loanID, loanBorrower, withdrawalAmount)
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.message)
      }
    })
  })
})