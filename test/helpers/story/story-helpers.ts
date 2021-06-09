import hre, { contracts, ethers } from 'hardhat'
import { BigNumber, Signer } from 'ethers'
import {
  createLoan,
  LoanType,
  takeOutLoanWithoutNfts,
  takeOutLoanWithNfts,
  TakeOutLoanArgs,
  CreateLoanArgs,
  repayLoan,
  RepayLoanArgs,
  LoanHelpersReturn,
  LoanDetailsReturn,
  CollateralFunctions,
} from '../loans'

import { getPlatformSetting, updatePlatformSetting } from '../../../tasks'
import { getFunds } from '../get-funds'
import {
  LPHelperArgs,
  depositWithArgs,
  withdrawWithArgs,
} from '../lending-pool'
import { getMarkets } from '../../../config'
import Prando from 'prando'
import moment from 'moment'
import { ERC20, ITellerDiamond, TellerNFT } from '../../../types/typechain'
let rng = new Prando('teller-v1')

export const LOAN_ACTIONS = {
  TAKE_OUT: 0,
  LP_LEND: 1,
  REPAY: 2,
  LIQUIDATE: 3,
  SWAP: 4,
  LEND: 5,
}

interface LoanArgs {
  type: string
  amount: BigNumber
  from: Signer
  nft: boolean
  collateral: CollateralFunctions
  diamond: ITellerDiamond
  details: LoanDetailsReturn
}

// generate test arg details based off action and pass
interface TestArgs {
  type: string
  pass: boolean
  revert?: string
  nft?: boolean
  loanArgs?: LoanArgs
}

const STORY_TREE: { [id: number]: number } = {
  0: -1,
  1: 0,
  2: 0,
  3: 0,
  4: 1,
}

const SNAPSHOTS: { [name: string]: Function } = {}

const getChildren = (id: number) => {
  return Object.entries(STORY_TREE).reduce(
    (prev: Array<any>, value: Array<any>) => {
      if (value[1] == id) {
        const child: number = Number(value[0])
        prev.push(child)
      }
      return prev
    },
    []
  )
}

const createLoanArgs = (): CreateLoanArgs => {
  const { network } = hre
  const markets = getMarkets(network)
  const randomMarket = rng.nextInt(0, markets.length - 1)
  const market = markets[randomMarket]
  console.log({ markets })
  const randomCollateralToken = rng.nextInt(
    0,
    market.collateralTokens.length - 1
  )
  const randomLoanType = rng.nextInt(0, Object.values(LoanType).length / 2 - 1)
  return {
    lendToken: market.lendingToken,
    collToken: market.collateralTokens[randomCollateralToken],
    loanType: randomLoanType,
  }
}

export const generateTests = async (args: TestArgs) => {
  SNAPSHOTS.revert = await hre.evm.snapshot()
  switch (args.type) {
    case LOAN_ACTIONS[0]: {
      const loanID = 0
      // run test
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} loan should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        // expect loan args to match loan case
        const createArgs = createLoanArgs()

        const percentageSubmission = {
          name: 'RequiredSubmissionsPercentage',
          value: 0,
        }
        await updatePlatformSetting(percentageSubmission, hre)

        // Advance time
        const { value: rateLimit } = await getPlatformSetting(
          'RequestLoanTermsRateLimit',
          hre
        )
        await hre.evm.advanceTime(rateLimit)

        const { tx, getHelpers } = args.nft
          ? await takeOutLoanWithNfts(createArgs)
          : await takeOutLoanWithoutNfts(createArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)
          //take snapshot
          SNAPSHOTS[loanID] = await hre.evm.snapshot()
          // get children
          const children = getChildren(loanID)
          if (children.length > 0) {
            const randomChild = rng.nextInt(0, children.length - 1)
            const child = children[randomChild]
            const helpers: LoanHelpersReturn = await getHelpers()
            const { diamond, collateral, details, takeOut } = helpers
            await generateTests({
              type: LOAN_ACTIONS[children[randomChild]],
              pass: args.pass,
              revert: args.revert,
              loanArgs: {
                type: LOAN_ACTIONS[children[randomChild]],
                amount: details.terms.maxLoanAmount,
                from: details.borrower.signer,
                collateral,
                nft: args.nft ? args.nft : false,
                diamond,
                details,
              },
            })
          }
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        checkError(args, error)
      }
      break
    }
    case LOAN_ACTIONS[1]: {
      const loanID = 1
      let lpHelperArgs: LPHelperArgs
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!verifyLoanArgs(args.loanArgs)) break
        const { diamond, details, amount, from, nft } = args.loanArgs
        const tToken = await hre.contracts.get('ITToken', {
          at: await diamond.getTTokenFor(details.lendingToken.address),
        })
        lpHelperArgs = {
          diamond: diamond,
          lendingToken: details.lendingToken,
          tToken: tToken,
        }
        // await hre.evm.advanceTime(moment.duration(5, 'minutes'))
        const tx = await depositWithArgs(lpHelperArgs)
        console.log('tx: %o', tx)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS[loanID] = await hre.evm.snapshot()
          // get children
          await callChildren(loanID, args)
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        checkError(args, error)
      }
      break
    }
    case LOAN_ACTIONS[2]: {
      const loanID = 2
      let repayLoanArgs: RepayLoanArgs
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!verifyLoanArgs(args.loanArgs)) break
        const { diamond, details, amount, from, nft } = args.loanArgs
        repayLoanArgs = {
          amount: amount,
          from: from,
          diamond,
          details,
        }
        await hre.evm.advanceTime(moment.duration(5, 'minutes'))
        const tx = await repayLoan(repayLoanArgs)
        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS[loanID] = await hre.evm.snapshot()
          // get children
          await callChildren(loanID, args)
        } else {
          console.log(`- Failed`.red)
        }
      } catch (error) {
        checkError(args, error)
      }
      break
    }
    case LOAN_ACTIONS[3]: {
      const loanID = 3
      console.log(
        `${LOAN_ACTIONS[loanID].toLowerCase()} should ${
          args.pass == true ? 'pass' : 'fail'
        }`.underline.magenta
      )
      try {
        if (!verifyLoanArgs(args.loanArgs)) break
        const { diamond, details, amount, from, nft } = args.loanArgs
        await hre.evm.advanceTime(details.loan.duration)
        const liquidator = await hre.getNamedSigner('liquidator')
        // let neededAmount = amount
        const liquidatorAddress = await liquidator.getAddress()
        const tokenBal = await details.lendingToken.balanceOf(liquidatorAddress)

        await getFunds({
          to: liquidatorAddress,
          tokenSym: await details.lendingToken.symbol(),
          amount: BigNumber.from(amount).mul(2),
          hre,
        })

        await details.lendingToken
          .connect(liquidator)
          .approve(diamond.address, BigNumber.from(amount).mul(2))

        const tx = await diamond
          .connect(liquidator)
          .liquidateLoan(details.loan.id)

        if (args.pass) {
          // check use cases
          if (tx) console.log(`- Pass`.green)

          //take snapshot
          SNAPSHOTS[loanID] = await hre.evm.snapshot()
          // get children
          await callChildren(loanID, args)
        } else {
          console.log(`- Failed 4`.red)
        }
      } catch (error) {
        checkError(args, error)
      }
      break
    }
  }
}

const checkError = (args: TestArgs, error: any) => {
  console.log('error: %o', error)
  if (!args.pass) {
    console.log(`- Pass`.green)
  } else {
    console.log(`- Failed err`.red)
  }
}

const callChildren = async (loanID: number, args: TestArgs) => {
  if (!verifyLoanArgs(args.loanArgs)) return
  const { diamond, details, amount, collateral, from, nft } = args.loanArgs
  const children = getChildren(loanID)
  if (children.length > 0) {
    const randomChild = rng.nextInt(0, children.length - 1)
    console.log('randomChild is: ', children[randomChild])
    await generateTests({
      type: LOAN_ACTIONS[children[randomChild]],
      pass: args.pass,
      loanArgs: {
        type: LOAN_ACTIONS[children[randomChild]],
        from,
        collateral,
        amount,
        nft: nft ? nft : false,
        diamond,
        details,
      },
    })
  }
}

const verifyLoanArgs = (loanArgs: LoanArgs | undefined) => {
  if (!loanArgs) {
    console.log(`- Fail`.red)
    return false
  }
  return true
}

const getParents = (id: number) => {
  return STORY_TREE[id]
}