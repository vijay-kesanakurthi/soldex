import { Connection, PublicKey } from "@solana/web3.js";

import {
  WhirlpoolContext,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  buildWhirlpoolClient,
  PDAUtil,
  PriceMath,
  increaseLiquidityQuoteByInputTokenWithParams,
} from "@orca-so/whirlpools-sdk";
// import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "@coral-xyz/anchor";
import { DecimalUtil, Percentage } from "@orca-so/common-sdk";
import Decimal from "decimal.js";
// import { Wallet } from "@coral-xyz/anchor";
// Anchor Wallet Definition

// export type Wallet = {
//   signTransaction: (transaction: Transaction) => Promise<TransactionSignature>;
//   signAllTransactions: (message: string) => Promise<TransactionSignature>;

export const SetupWhirlpool = async (wallet: Wallet) => {
  //   const { signAllTransactions, signTransaction, publicKey } = useWallet();

  //   if (!publicKey || !signTransaction || !signAllTransactions) {
  //     return null;
  //   }

  //   const wallet = {
  //     signTransaction: signTransaction,
  //     signAllTransactions: signAllTransactions,
  //     publicKey,
  //   };

  const connection = new Connection("https://api.devnet.solana.com");
  // const provider = new AnchorProvider(connection, wallet, {});
  // const client = await buildWhirlpoolClient(provider, ORCA_WHIRLPOOL_PROGRAM_ID);

  const context = WhirlpoolContext.from(
    connection,
    wallet,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(context);

  const devUSDC = {
    mint: new PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"),
    decimals: 6,
  };
  const devSAMO = {
    mint: new PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa"),
    decimals: 9,
  };

  const tick_spacing = 64;
  const DEVNET_WHIRLPOOLS_CONFIG = new PublicKey(
    "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"
  );
  const whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    DEVNET_WHIRLPOOLS_CONFIG,
    devSAMO.mint,
    devUSDC.mint,
    tick_spacing
  ).publicKey;
  //   console.log("whirlpool_key:", whirlpool_pubkey.toBase58());
  const whirlpool = await client.getPool(whirlpool_pubkey);
  //   console.log("whirlpool:", whirlpool);
  const whirlpool_data = whirlpool.getData();

  const sqrt_price_x64 = whirlpool_data.sqrtPrice;
  const price = PriceMath.sqrtPriceX64ToPrice(
    sqrt_price_x64,
    devSAMO.decimals,
    devUSDC.decimals
  );
  console.log("price:", price.toFixed(devUSDC.decimals));
  // Set price range, amount of tokens to deposit, and acceptable slippage
  const lower_price = new Decimal("0.005");
  const upper_price = new Decimal("0.02");
  const dev_usdc_amount = DecimalUtil.toBN(
    new Decimal("1" /* devUSDC */),
    devUSDC.decimals
  );
  const slippage = Percentage.fromFraction(10, 1000); // 1%

  // Adjust price range (not all prices can be set, only a limited number of prices are available for range specification)
  // (prices corresponding to InitializableTickIndex are available)
  const token_a = whirlpool.getTokenAInfo();
  const token_b = whirlpool.getTokenBInfo();
  const lower_tick_index = PriceMath.priceToInitializableTickIndex(
    lower_price,
    token_a.decimals,
    token_b.decimals,
    whirlpool_data.tickSpacing
  );
  const upper_tick_index = PriceMath.priceToInitializableTickIndex(
    upper_price,
    token_a.decimals,
    token_b.decimals,
    whirlpool_data.tickSpacing
  );
  console.log("lower & upper tick_index:", lower_tick_index, upper_tick_index);
  console.log(
    "lower & upper price:",
    PriceMath.tickIndexToPrice(
      lower_tick_index,
      token_a.decimals,
      token_b.decimals
    ).toFixed(token_b.decimals),
    PriceMath.tickIndexToPrice(
      upper_tick_index,
      token_a.decimals,
      token_b.decimals
    ).toFixed(token_b.decimals)
  );

  // Obtain deposit estimation
  const quote = increaseLiquidityQuoteByInputTokenWithParams({
    // Pass the pool definition and state
    tokenMintA: token_a.mint,
    tokenMintB: token_b.mint,
    sqrtPrice: whirlpool_data.sqrtPrice,
    tickCurrentIndex: whirlpool_data.tickCurrentIndex,
    // Price range
    tickLowerIndex: lower_tick_index,
    tickUpperIndex: upper_tick_index,
    // Input token and amount
    inputTokenMint: devUSDC.mint,
    inputTokenAmount: dev_usdc_amount,
    // Acceptable slippage
    slippageTolerance: slippage,
  });

  // Output the estimation
  console.log(
    "devSAMO max input:",
    DecimalUtil.fromBN(quote.tokenMaxA, token_a.decimals).toFixed(
      token_a.decimals
    )
  );
  console.log(
    "devUSDC max input:",
    DecimalUtil.fromBN(quote.tokenMaxB, token_b.decimals).toFixed(
      token_b.decimals
    )
  );
  const open_position_tx = await whirlpool.openPositionWithMetadata(
    lower_tick_index,
    upper_tick_index,
    quote
  );

  // Send the transaction
  const signature = await open_position_tx.tx.buildAndExecute();
  console.log("signature:", signature);
  console.log("position NFT:", open_position_tx.positionMint.toBase58());

  // Wait for the transaction to complete
  const latest_blockhash = await context.connection.getLatestBlockhash();
  console.log(
    await context.connection.confirmTransaction(
      { signature, ...latest_blockhash },
      "confirmed"
    )
  );
};
//   return { context, client };
