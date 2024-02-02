import { DecimalUtil, Percentage } from "@orca-so/common-sdk";
import {
  WhirlpoolContext,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  SwapQuote,
  WhirlpoolClient,
  swapQuoteByInputToken,
  IGNORE_CACHE,
} from "@orca-so/whirlpools-sdk";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";

const DEVNET_WHIRLPOOLS_CONFIG = new PublicKey(
  "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"
);

export async function getSwapQuote(
  mint: PublicKey,
  amount_in: number,
  whirlpool_pubkey: PublicKey,
  ctx: WhirlpoolContext,
  client: WhirlpoolClient
): Promise<SwapQuote> {
  const whirlpool = await client.getPool(whirlpool_pubkey);
  const amount = new Decimal(amount_in.toString());
  try {
    const quote = await swapQuoteByInputToken(
      whirlpool,
      mint,
      DecimalUtil.toBN(amount, 6),
      Percentage.fromFraction(10, 1000),
      ctx.program.programId,
      ctx.fetcher,
      IGNORE_CACHE
    );
    return quote;
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getWhirlpoolPubkey(
  token1: PublicKey,
  token2: PublicKey,
  tick_spacing: number
): Promise<PublicKey> {
  const whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    DEVNET_WHIRLPOOLS_CONFIG,
    token1,
    token2,
    tick_spacing
  ).publicKey;
  return whirlpool_pubkey;
}
