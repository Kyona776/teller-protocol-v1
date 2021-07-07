import { NetworkTokens } from '../types/custom/config-types'

// ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
const mainnetTokens: NetworkTokens = {
  compound: {
    CDAI: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    CUSDC: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
    CETH: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
  },
  aave: {
    ADAI: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
  },
  poolTogether: {
    PTDAI: '0x334cbb5858417aee161b53ee0d5349ccf54514cf',
    PTDAIS: '0x0A2E7f69fe9588fa7fBa5F5864236883Cd4AaC6d',
  },
  yearn: {
    YDAI: '0x19D3364A399d251E894aC732651be8B0E4e85001', // v2 - DAI yVault
  },
  erc20: {
    // Compound
    COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    // Aave
    AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    // Pool Together
    // Yearn
    // ERC20
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    SNX: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    YFI: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
  },
}

const polygonTokens: NetworkTokens = {
  aave: {
    ADAI: '0x27F8D03b3a2196956ED754baDc28D73be8830A6e', // amDAI
    AUSDC: '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F',
    AETH: '0x28424507fefb6f7f8E9D3860F56504E4e5f5f390', //amWETH
  },
  poolTogether: {
    PTDAI: '0x3e35681E6439961EC7F2b1ABaB6b967D6a645270',
    PTDAIS: '0xB102A0Ba3707A94a64CE63c7BeA8039680e1ad5C',
  },
  erc20: {
    // Aave
    AAVE: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B',
    // Pool Together
    // ERC20
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    LINK: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
    WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  },
}

export const tokens: Record<string, NetworkTokens> = {
  kovan: {
    compound: {
      CDAI: '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
      CUSDC: '0x4a92e71227d294f041bd82dd8f78591b75140d63',
      CETH: '0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72',
    },
    erc20: {
      // Compound
      COMP: '0x61460874a7196d6a22d1ee4922473664b3e95270',
      // Aave
      // Pool Together
      // Yearn
      // ERC20
      WETH: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
      DAI: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
      USDC: '0xb7a4f3e9097c08da09517b5ab877f7a917224ede',
      LINK: '0xa36085F69e2889c224210F603D836748e7dC0088',
    },
  },
  rinkeby: {
    compound: {
      CDAI: '0x6D7F0754FFeb405d23C51CE938289d4835bE3b14',
      CUSDC: '0x5B281A6DdA0B271e91ae35DE655Ad301C976edb1',
      CETH: '0xd6801a1dffcd0a410336ef88def4320d6df1883e',
    },
    erc20: {
      // Compound
      // Aave
      // Pool Together
      // Yearn
      // ERC20
      WETH: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
      DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
      USDC: '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b',
      LINK: '0x01BE23585060835E02B77ef475b0Cc51aA1e0709',
    },
  },
  ropsten: {
    compound: {
      CDAI: '0xdb5Ed4605C11822811a39F94314fDb8F0fb59A2C',
      CUSDC: '0x8aF93cae804cC220D1A608d4FA54D1b6ca5EB361',
      CETH: '0xbe839b6d93e3ea47effcca1f27841c917a8794f3',
    },
    erc20: {
      // Compound
      COMP: '0xf76d4a441e4ba86a923ce32b89aff89dbccaa075',
      // Aave
      // Pool Together
      // Yearn
      // ERC20
      WETH: '0xc778417e063141139fce010982780140aa0cd5ab',
      DAI: '0xc2118d4d90b274016cB7a54c03EF52E6c537D957',
      USDC: '0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C',
      LINK: '0x20fE562d797A42Dcb3399062AE9546cd06f63280',
    },
  },
  polygon: polygonTokens,
  polygon_mumbai: {
    aave: {
      ADAI: '0x639cB7b21ee2161DF9c882483C9D55c90c20Ca3e', // amDAI
      AUSDC: '0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9',
      AETH: '0x7aE20397Ca327721F013BB9e140C707F82871b56', //amWETH
    },
    erc20: {
      // Aave
      AAVE: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      // Pool Together
      // ERC20
      WETH: '0x3C68CE8504087f89c640D02d133646d98e64ddd9',
      WMATIC: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
      DAI: '0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F',
      USDC: '0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e',
      USDT: '0xBD21A10F619BE90d6066c941b04e340841F1F989',
      LINK: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
      WBTC: '0x0d787a4a1548f673ed375445535a6c7A1EE56180',
    },
  },
  hardhat: polygonTokens,
  localhost: polygonTokens,
  mainnet: mainnetTokens,
}
