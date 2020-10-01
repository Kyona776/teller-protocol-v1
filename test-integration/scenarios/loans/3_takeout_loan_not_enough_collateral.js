// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  oracles: oraclesActions,
  blockchain: blockchainActions,
  tokens: tokensActions,
} = require("../../utils/actions");
const {toDecimals} = require("../../../test/utils/consts");

module.exports = async (testContext) => {
  const {
    accounts,
    getContracts,
    timer,
    collTokenName,
    tokenName,
  } = testContext;
  console.log(
    "Scenario: Loans#3 - Take out a loan and repay all at once in full successfully."
  );

  const allContracts = await getContracts.getAllDeployed(
    {teller, tokens},
    tokenName,
    collTokenName
  );
  const {token, collateralToken} = allContracts;

  const borrower = await accounts.getAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);
  let currentOraclePrice;
  if (collTokenName.toLowerCase() === "eth") {
    currentOraclePrice = toDecimals("0.002797359", 18);
  }
  if (collTokenName.toLowerCase() === "link") {
    currentOraclePrice = toDecimals("0.100704", 8);
  }

  const tokenInfo = await tokensActions.getInfo({token});
  const collateralTokenInfo = await tokensActions.getInfo({
    token: collateralToken,
  });

  const depositFundsAmount = toDecimals(500, tokenInfo.decimals);
  const maxAmountRequestLoanTerms = toDecimals(150, tokenInfo.decimals);
  const amountTakeOut = toDecimals(100, tokenInfo.decimals);
  const collateralAmountDepositCollateral = toDecimals(
    0.17,
    collateralTokenInfo.decimals
  );

  const durationInDays = 10;
  const signers = await accounts.getAllAt(12, 13);

  // Sets Initial Oracle Price
  await oraclesActions.setPrice(
    allContracts,
    {testContext},
    {price: currentOraclePrice}
  );
  await loansActions.printPairAggregatorInfo(
    allContracts,
    { testContext },
    { tokenInfo, collateralTokenInfo }
  );

  // Deposit tokens on lending pool.
  await loansActions.depositFunds(
    allContracts,
    {txConfig: lenderTxConfig, testContext},
    {amount: depositFundsAmount}
  );

  // Requesting the loan terms.
  const loanTermsRequestTemplate = {
    amount: amountTakeOut,
    durationInDays,
    borrower,
  };
  const loanResponseTemplate = {
    interestRate: 4000,
    collateralRatio: 6000,
    maxLoanAmount: maxAmountRequestLoanTerms,
    signers,
    responseTime: 50,
  };
  const loanInfoRequestLoanTerms = await loansActions.requestLoanTerms(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanTermsRequestTemplate, loanResponseTemplate}
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {
      loanId: loanInfoRequestLoanTerms.id,
      amount: collateralAmountDepositCollateral,
    }
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 2});

  // Take out a loan.
  await loansActions.takeOutLoan(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {
      loanId: loanInfoRequestLoanTerms.id,
      amount: amountTakeOut,
      expectedErrorMessage: "MORE_COLLATERAL_REQUIRED",
    }
  );

  await loansActions.printLoanInfo(
    allContracts,
    {testContext},
    {
      loanId: loanInfoRequestLoanTerms.id,
      collateralTokenInfo,
      tokenInfo,
    }
  );
};
