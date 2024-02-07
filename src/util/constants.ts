import { PublicKey } from "@solana/web3.js";
import { coins } from "./devCoins";

export const network: string = "mainnet";
export const networkUrl: string =
  "https://mainnet.helius-rpc.com/?api-key=3f33bb5c-708a-4f5f-b9b3-8794bbdd58f2";

// export const network: string = "devnet";
// export const networkUrl: string =
//   "https://devnet.helius-rpc.com/?api-key=3f33bb5c-708a-4f5f-b9b3-8794bbdd58f2";

const DEVNET_WHIRLPOOLS_CONFIG = new PublicKey(
  "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"
);
const MAINNET_WHIRLPOOLS_CONFIG = new PublicKey(
  "2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ"
);
export const WHIRLPOOL_CONFIG: PublicKey =
  network === "devnet" ? DEVNET_WHIRLPOOLS_CONFIG : MAINNET_WHIRLPOOLS_CONFIG;

const USDC_SOL = new PublicKey("HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ");
const USDT_SOL = new PublicKey("5zVKUoZcQkFCGcRHVHiyGAJRrZj1by67pW3dmvguFvwd");
const ORCA_SOL = new PublicKey("HrvrhPtNq8JEGbi7dhMFuXy1Jms49nZrgC6GLjZ3cPyo");
const USDC_USDT = new PublicKey("6apMj56v2L2YcKojA56o2yXD4LZv7jG7WnhCpyim15AV");
const ORCA_USDC = new PublicKey("5Z66YYYaTmmx1R4mATAGLSc8aV4Vfy5tNdJQzk1GP9RF");
const ORCA_USDT = new PublicKey("2B6rktciJxwjZYxT8xnFLW8uKmRQozXRtMzxmMf73PDF");
const RAY_SOL = new PublicKey("D3C5H4YU7rjhK7ePrGtK1Bhde4tfeiTr98axdZnA7tet");
const RAY_USDC = new PublicKey("96UbjyFmQY1JLpTvRujrkABxm1ft5hQvSVnv4JbagTMZ");
const RAY_USDT = new PublicKey("99MPQXfGCHG1Lk1UREKetMuCPkYMHqkPmc5vFB9zoKBc");
const RAY_ORCA = new PublicKey("2ntusSb3dL7LBuTys6wG9pAyB3hWvaei1oa2MucX3Pct");

const SOL_devUSDT = new PublicKey(
  "3KBZiL2g8C7tiJ32hTv5v3KM7aK9htpqTw4cTXz1HvPt"
);
const devUSDC_devUSDT = new PublicKey(
  "63cMwvN8eoaD39os9bKP8brmA7Xtov9VxahnPufWCSdg"
);

const devSAMO_devUSDC = new PublicKey(
  "EgxU92G34jw6QDG9RuTX9StFg1PmHuDqkRKAE5kVEiZ4"
);

const devTMAC_devUSDC = new PublicKey(
  "H3xhLrSEyDFm6jjG42QezbvhSxF5YHW75VdGUnqeEg5y"
);

export const keyMap =
  network === "devnet"
    ? {
        SOL: { devUSDT: SOL_devUSDT },
        devUSDC: { devUSDT: devUSDC_devUSDT },
        devSAMO: { devUSDC: devSAMO_devUSDC },
        devTMAC: { devUSDC: devTMAC_devUSDC },
        devUSDT: { SOL: SOL_devUSDT, devUSDC: devUSDC_devUSDT },
      }
    : {
        USDC: {
          SOL: USDC_SOL,
          USDT: USDC_USDT,
          ORCA: ORCA_USDC,
          RAY: RAY_USDC,
        },
        USDT: {
          SOL: USDT_SOL,
          USDC: USDC_USDT,
          ORCA: ORCA_USDT,
          RAY: RAY_USDT,
        },
        ORCA: {
          SOL: ORCA_SOL,
          USDC: ORCA_USDC,
          USDT: ORCA_USDT,
          RAY: RAY_ORCA,
        },
        RAY: { SOL: RAY_SOL, USDC: RAY_USDC, USDT: RAY_USDT, ORCA: RAY_ORCA },
        SOL: { USDC: USDC_SOL, USDT: USDT_SOL, ORCA: ORCA_SOL, RAY: RAY_SOL },
      };

// function to get CoinModel from token mintAdreess
export const getCoin = (mintAddress: PublicKey) =>
  coins.find((coin) => coin.mintAddress == mintAddress.toBase58());
