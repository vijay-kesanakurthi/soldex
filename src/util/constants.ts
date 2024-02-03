import { PublicKey } from "@solana/web3.js";

export const network: string = "mainnet";
export const networkUrl: string =
  "https://mainnet.helius-rpc.com/?api-key=3f33bb5c-708a-4f5f-b9b3-8794bbdd58f2";

// export const network: string = "devnet";
// export const networkUrl: string = "https://devnet.helius-rpc.com/?api-key=3f33bb5c-708a-4f5f-b9b3-8794bbdd58f2";

const DEVNET_WHIRLPOOLS_CONFIG = new PublicKey(
  "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"
);
const MAINNET_WHIRLPOOLS_CONFIG = new PublicKey(
  "2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ"
);
export const WHIRLPOOL_CONFIG: PublicKey =
  network === "devnet" ? DEVNET_WHIRLPOOLS_CONFIG : MAINNET_WHIRLPOOLS_CONFIG;
