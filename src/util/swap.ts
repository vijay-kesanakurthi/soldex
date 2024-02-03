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
import { WHIRLPOOL_CONFIG } from "./constants";

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
      DecimalUtil.toBN(amount),
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
    WHIRLPOOL_CONFIG,
    token1,
    token2,
    tick_spacing
  ).publicKey;
  console.log("whirlpool_key:", whirlpool_pubkey.toBase58());
  return whirlpool_pubkey;
}

export async function swapTokens(
  ctx: WhirlpoolContext,
  client: WhirlpoolClient,
  whirlpool_pubkey: PublicKey,
  quote: SwapQuote
): Promise<string> {
  // Send the transaction
  const whirlpool = await client.getPool(whirlpool_pubkey);
  const tx = await whirlpool.swap(quote);
  const signature = await tx.buildAndExecute();
  console.log("signature:", signature);

  // Wait for the transaction to complete
  const latest_blockhash = await ctx.connection.getLatestBlockhash();
  await ctx.connection.confirmTransaction(
    { signature, ...latest_blockhash },
    "confirmed"
  );
  return signature;
}

// import { createJupiterApiClient, ResponseError } from "@jup-ag/api";
// const jupiterQuoteApi = createJupiterApiClient();
// const quoteResponse = async () => {
//   try {
//     if (getInputAmount().toString() === "NaN") {
//       return;
//     }
//     const quoteResponse = await (
//       await fetch(
//         `https://quote-api.jup.ag/v6/quote?inputMint=${
//           fromAsset.mintAddress
//         }&outputMint=${toAsset.mintAddress}&amount=${
//           getInputAmount() * 10 ** fromAsset.decimals
//         }&slippageBps=500`
//       )
//     )
//       .json()
//       .catch((err) => {
//         console.log(err);
//         setQuote(null);
//       });
//     console.log(quoteResponse);
//     setOutputAmount(quoteResponse.outAmount / 10 ** toAsset.decimals);
//     setQuote(quoteResponse);
//   } catch (err) {
//     console.log(err);
//   }
// };

// const jupQuoteResponse = async () => {
//   try {
//     if (getInputAmount().toString() === "NaN") {
//       return;
//     }
//     const quoteResponse = await jupiterQuoteApi.quoteGet({
//       inputMint: fromAsset.mintAddress,
//       outputMint: toAsset.mintAddress,
//       amount: getInputAmount() * 10 ** fromAsset.decimals,
//       slippageBps: 50,
//     });
//     if (!quoteResponse) {
//       setQuote(null);
//       setOutputAmount(0);

//       console.log("unable to quote");
//       return;
//     }
//     console.log(quoteResponse);
//     setOutputAmount(
//       Number(quoteResponse.outAmount) / 10 ** Number(toAsset.decimals)
//     );

//     setQuote(quoteResponse);
//   } catch (e) {
//     setQuote(null);
//     setOutputAmount(0);
//     if (e instanceof ResponseError) {
//       console.log(await e.response.json());
//     }

//     console.log(e);
//   }
// };

// async function signAndSendTransaction() {
//   if (!wallet.connected || !wallet?.signTransaction) {
//     console.error(
//       "Wallet is not connected or does not support signing transactions"
//     );
//     return;
//   }

//   setLoading(true);
//   console.log("quote", quote);
//   console.log("wallet", wallet);
//   console.log("publicKey", publicKey?.toString());
//   console.log("connection", connection);

//   // get serialized transactions for the swap

//   try {
//     // const trans = await (
//     //   await fetch("https://quote-api.jup.ag/v6/swap", {
//     //     method: "POST",
//     //     headers: {
//     //       "Content-Type": "application/json",
//     //     },
//     //     body: JSON.stringify({
//     //       quoteResponse: quote,
//     //       userPublicKey: wallet.publicKey?.toString(),
//     //       wrapAndUnwrapSol: true,
//     //       // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
//     //       // feeAccount: "fee_account_public_key"
//     //       dynamicComputeUnitLimit: true, // allow dynamic compute limit instead of max 1,400,000
//     //       // custom priority fee
//     //       prioritizationFeeLamports: { autoMultiplier: 2 },
//     //     }),
//     //   })
//     // ).json();
//     const priorityFee: PriorityFee = await getRecentPrioritizationFees();
//     console.log("priorityFee", priorityFee);
//     if (!priorityFee.low) {
//       toast.error("Error getting priority fee");
//       return;
//     }

//     const key = wallet.publicKey?.toString() || "";
//     const trans = await jupiterQuoteApi.swapPost({
//       swapRequest: {
//         quoteResponse: quote,
//         userPublicKey: key,
//         dynamicComputeUnitLimit: true,
//         wrapAndUnwrapSol: true,

//         prioritizationFeeLamports: { autoMultiplier: 2 },
//       },
//     });
//     const swapTransaction = trans.swapTransaction;

//     console.log("swapTransaction", trans);
//     const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
//     const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
//     const signedTransaction = await wallet.signTransaction(transaction);

//     const rawTransaction = signedTransaction.serialize();
//     const txid = await connection.sendRawTransaction(rawTransaction, {
//       skipPreflight: true,
//       maxRetries: 2,
//     });
//     console.log("txid", txid);

//     const latestBlockHash = await connection.getLatestBlockhash();
//     const sig = await connection.confirmTransaction(
//       {
//         blockhash: latestBlockHash.blockhash,
//         lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
//         signature: txid,
//       },
//       "confirmed"
//     );
//     console.log("sig", sig);
//     // toast.success(`Token swapped successfully https://solscan.io/tx/${txid}`);
//     toast.success(CustomToastToOpenLink(txid));
//     getTokenBalanceByMint(
//       publicKey || new PublicKey(""),
//       connection,
//       fromAsset.mintAddress
//     ).then((data: BlanceDetails) => {
//       setMaxBalance(Number(data.ui_amount));
//     });

//     console.log(`https://solscan.io/tx/${txid}`);
//   } catch (error) {
//     toast.error("Error signing or sending the transaction");
//     console.error("Error signing or sending the transaction:", error);
//     if (error instanceof ResponseError) {
//       console.log(await error.response.json());
//     }
//   } finally {
//     setLoading(false);
//   }
// }

// const firstCoinRef = useRef<HTMLDivElement>(null);
// const secondCoinRef = useRef<HTMLDivElement>(null);

// const handleClickOutside = (event: MouseEvent) => {
//   if (
//     firstCoinRef.current &&
//     !firstCoinRef.current.contains(event.target as Node)
//   ) {
//     setOpen1stCoin(false);
//   }
//   if (
//     secondCoinRef.current &&
//     !secondCoinRef.current.contains(event.target as Node)
//   ) {
//     setOpen2ndCoin(false);
//   }
// };

// useEffect(() => {
//   document.addEventListener("mousedown", handleClickOutside);

//   return () => {
//     document.removeEventListener("mousedown", handleClickOutside);
//   };
// }, []);
