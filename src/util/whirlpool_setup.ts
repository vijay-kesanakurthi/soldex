import { Connection } from "@solana/web3.js";

import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  WhirlpoolClient,
} from "@orca-so/whirlpools-sdk";
// import { Wallet } from "@coral-xyz/anchor";
import { networkUrl } from "./constants";

export const SetupWhirlpool = async (
  wallet: any
): Promise<{ ctx: WhirlpoolContext; client: WhirlpoolClient }> => {
  const connection = new Connection(networkUrl);

  const ctx = WhirlpoolContext.from(
    connection,
    wallet,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  console.log("ctx:", ctx);
  const client = buildWhirlpoolClient(ctx);

  // getWhirlpoolPubkeyCheck(client);
  return { ctx, client };
};

// export async function getWhirlpoolPubkeyCheck(client: WhirlpoolClient) {
//   const myTokens = tokens.slice(300); // Use slice to create a shallow copy
//   const successResults: string[] = [];

//   const processToken = async (token) => {
//     try {
//       const whirlpool_pubkey = PDAUtil.getWhirlpool(
//         ORCA_WHIRLPOOL_PROGRAM_ID,
//         WHIRLPOOL_CONFIG,
//         new PublicKey("orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE"),
//         new PublicKey(token.mint),
//         64
//       ).publicKey;

//       const res = await client.getPool(whirlpool_pubkey);
//       successResults.push(`Success: ${token.name}`);
//       console.log("token :", token.name);
//       console.log("token Address", token.mint);
//     } catch (err) {
//       // Ignore errors
//     }
//   };

//   const processNextToken = async () => {
//     if (myTokens.length === 0) {
//       console.log("Success Results:", successResults);
//     } else {
//       const tokenToProcess = myTokens.shift();
//       await processToken(tokenToProcess);
//       setTimeout(processNextToken, 500); // Call the next token after 1 second
//     }
//   };

//   processNextToken();
// }

// Wallet;
// Wallet={
//   publicKey;
//   signTransaction;
//   signAllTransactions;

// }

// const devUSDC = {
//   mint: new PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"),
//   decimals: 6,
// };
// const devSAMO = {
//   mint: new PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa"),
//   decimals: 9,
// };

// // WhirlpoolsConfig account
// // devToken ecosystem / Orca Whirlpools
// const DEVNET_WHIRLPOOLS_CONFIG = new PublicKey(
//   "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"
// );

// // Get devSAMO/devUSDC whirlpool
// // Whirlpools are identified by 5 elements (Program, Config, mint address of the 1st token,
// // mint address of the 2nd token, tick spacing), similar to the 5 column compound primary key in DB
// const tick_spacing = 64;
// const whirlpool_pubkey = PDAUtil.getWhirlpool(
//   ORCA_WHIRLPOOL_PROGRAM_ID,
//   DEVNET_WHIRLPOOLS_CONFIG,
//   devSAMO.mint,
//   devUSDC.mint,
//   tick_spacing
// ).publicKey;
// console.log("whirlpool_key:", whirlpool_pubkey.toBase58());
// const whirlpool = await client.getPool(whirlpool_pubkey);

// // Swap 1 devUSDC for devSAMO
// const amount_in = new Decimal("1" /* devUSDC */);

// // Obtain swap estimation (run simulation)
// const quote = await swapQuoteByInputToken(
//   whirlpool,
//   // Input token and amount
//   devUSDC.mint,
//   DecimalUtil.toBN(amount_in, devUSDC.decimals),
//   // Acceptable slippage (10/1000 = 1%)
//   Percentage.fromFraction(10, 1000),
//   ctx.program.programId,
//   ctx.fetcher,
//   IGNORE_CACHE
// );

// console.log("quote:", quote);
// // Output the estimation
// console.log(
//   "estimatedAmountIn:",
//   DecimalUtil.fromBN(quote.estimatedAmountIn, devUSDC.decimals).toString(),
//   "devUSDC"
// );
// console.log(
//   "estimatedAmountOut:",
//   DecimalUtil.fromBN(quote.estimatedAmountOut, devSAMO.decimals).toString(),
//   "devSAMO"
// );
// console.log(
//   "otherAmountThreshold:",
//   DecimalUtil.fromBN(quote.otherAmountThreshold, devSAMO.decimals).toString(),
//   "devSAMO"
// );

// // Send the transaction
// const tx = await whirlpool.swap(quote);
// const signature = await tx.buildAndExecute();
// console.log("signature:", signature);

// // Wait for the transaction to complete
// const latest_blockhash = await ctx.connection.getLatestBlockhash();
// await ctx.connection.confirmTransaction(
//   { signature, ...latest_blockhash },
//   "confirmed"
// );
