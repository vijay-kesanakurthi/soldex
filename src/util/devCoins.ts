import { CoinModel } from "./coinModel";
import { network } from "./constants";

export const coins: CoinModel[] =
  network === "devnet"
    ? [
        {
          tokenSymbol: "SOL",
          mintAddress: "So11111111111111111111111111111111111111112",
          tokenName: "Solana",
          icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
          decimals: 9,
        },
        {
          tokenName: "devUSDC",
          tokenSymbol: "devUSDC",
          mintAddress: "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k",
          decimals: 6,
          icon: "https://arweave.net/nvqvx1OGtfR4bqI7mg3MfPmubnxDoWReLgCML2DO_9c?ext=svg",
        },
        {
          tokenName: "devUSDT",
          tokenSymbol: "devUSDT",
          mintAddress: "H8UekPGwePSmQ3ttuYGPU1szyFfjZR4N53rymSFwpLPm",
          decimals: 6,
          icon: "https://cdn.jsdelivr.net/gh/saber-hq/spl-token-icons@master/icons/101/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB.svg",
        },
        {
          tokenName: "devSAMO",
          tokenSymbol: "devSAMO",
          mintAddress: "Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa",
          decimals: 9,
          icon: "https://assets.coingecko.com/coins/images/15051/large/IXeEj5e.png?1619560738",
        },
        {
          tokenName: "devTMAC",
          tokenSymbol: "devTMAC",
          mintAddress: "Afn8YB1p4NsoZeS5XJBZ18LTfEy5NFPwN46wapZcBQr6",
          decimals: 6,
          icon: "https://assets.coingecko.com/coins/images/22228/small/nFPNiSbL_400x400.jpg",
        },
      ]
    : [
        {
          tokenSymbol: "SOL",
          mintAddress: "So11111111111111111111111111111111111111112",
          tokenName: "Solana",
          icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
          decimals: 9,
        },
        {
          tokenSymbol: "USDC",
          mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          tokenName: "USDC",
          icon: "https://raw.githubusercontent.com/trustwallet/assets/f3ffd0b9ae2165336279ce2f8db1981a55ce30f8/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
          decimals: 6,
        },
        {
          tokenSymbol: "USDT",
          mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
          tokenName: "USDT",
          icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BQcdHdAQW1hczDbBi9hiegXAR7A98Q9jx3X3iBBBDiq4/logo.png",
          decimals: 6,
        },
        {
          mintAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
          tokenSymbol: "ORCA",
          tokenName: "Orca",
          decimals: 6,
          icon: "https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png?1628781615",
        },
        {
          mintAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
          tokenSymbol: "RAY",
          tokenName: "Raydium",
          decimals: 6,
          icon: "https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg?1612875614",
        },
      ];
