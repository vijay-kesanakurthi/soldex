type CoinModel = {
  tokenSymbol: string;
  mintAddress: string;
  tokenName: string;
  icon: string;
  decimals: number;
};

export const coins: CoinModel[] = [
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
    mintAddress: "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
    tokenName: "Serum",
    tokenSymbol: "SRM",
    icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x476c5E26a75bd202a9683ffD34359C0CC15be0fF/logo.png",
    decimals: 6,
  },
  {
    mintAddress: "SF3oTvfWzEP3DTwGSvUXRrGTvr75pdZNnBLAH9bzMuX",
    tokenName: "Raydium",
    tokenSymbol: "RAY",
    icon: "https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg?1612875614",
    decimals: 6,
  },
  {
    mintAddress: "7JF2qJLXK1g6JHvN5NdM3e1HfsWBt9Nv1uTjJ2Mp8edp",
    tokenName: "Orca",
    tokenSymbol: "ORCA",
    icon: "https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png?1628781615",
    decimals: 6,
  },
 
];

export type { CoinModel };
