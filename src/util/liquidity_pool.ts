import { positionData } from "./liquidity_pool";
import { PublicKey, TokenAmount } from "@solana/web3.js";
import {
  WhirlpoolContext,
  WhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  PriceMath,
  increaseLiquidityQuoteByInputTokenWithParams,
  IGNORE_CACHE,
  PoolUtil,
  WhirlpoolIx,
  decreaseLiquidityQuoteByLiquidityWithParams,
  IncreaseLiquidityQuote,
  TokenAmounts,
} from "@orca-so/whirlpools-sdk";
import {
  DecimalUtil,
  EMPTY_INSTRUCTION,
  Instruction,
  Percentage,
  TransactionBuilder,
  resolveOrCreateATA,
} from "@orca-so/common-sdk";
import Decimal from "decimal.js";
import { getPoolPubKey } from "./swap";
import { CoinModel } from "./coinModel";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  unpackAccount,
} from "@solana/spl-token";
import { BN } from "bn.js";

export async function getPoolQuote(
  client: WhirlpoolClient,
  coin_a: CoinModel,
  coin_b: CoinModel,
  amount: number
): Promise<{
  quote: IncreaseLiquidityQuote;
  lower_tick_index: number;
  upper_tick_index: number;
}> {
  const poolAddress = getPoolPubKey(coin_a.tokenSymbol, coin_b.tokenSymbol);
  const whirlpool = await client.getPool(poolAddress);

  // Get the current price of the pool
  const sqrt_price_x64 = whirlpool.getData().sqrtPrice;
  const price = PriceMath.sqrtPriceX64ToPrice(
    sqrt_price_x64,
    coin_a.decimals,
    coin_b.decimals
  );
  console.log("price:", price.toFixed(coin_a.decimals));

  // Set price range, amount of tokens to deposit, and acceptable slippage
  const lower_price = price.times(0.99);
  const upper_price = price.times(1.01);

  const dev_usdc_amount = DecimalUtil.toBN(
    DecimalUtil.fromNumber(amount),
    coin_a.decimals
  );
  const slippage = Percentage.fromFraction(10, 1000); // 1%

  // Adjust price range (not all prices can be set, only a limited number of prices are available for range specification)
  // (prices corresponding to InitializableTickIndex are available)
  const whirlpool_data = whirlpool.getData();
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
    inputTokenMint: token_a.mint,
    inputTokenAmount: dev_usdc_amount,
    // Acceptable slippage
    slippageTolerance: slippage,
  });

  // Output the estimation
  console.log(
    `${coin_a.tokenName} max input:`,
    DecimalUtil.fromBN(quote.tokenMaxA, token_a.decimals).toFixed(
      token_a.decimals
    )
  );
  console.log(
    `${coin_b.tokenName} max input:`,
    DecimalUtil.fromBN(quote.tokenMaxB, token_b.decimals).toFixed(
      token_b.decimals
    )
  );
  console.log(
    `${coin_a.tokenName} est input:`,
    DecimalUtil.fromBN(quote.tokenEstA, token_a.decimals).toFixed(
      token_a.decimals
    )
  );
  console.log(
    `${coin_b.tokenName} est input:`,
    DecimalUtil.fromBN(quote.tokenEstB, token_b.decimals).toFixed(
      token_b.decimals
    )
  );

  console.log(quote);

  // Create a transaction
  // Use openPosition method instead of openPositionWithMetadata method
  // const open_position_tx = await whirlpool.openPosition(
  //   lower_tick_index,
  //   upper_tick_index,
  //   quote
  // );

  // // Send the transaction
  // const signature = await open_position_tx.tx.buildAndExecute();
  // console.log("signature:", signature);
  // console.log("position NFT:", open_position_tx.positionMint.toBase58());

  // // Wait for the transaction to complete
  // const latest_blockhash = await ctx.connection.getLatestBlockhash();
  // await ctx.connection.confirmTransaction(
  //   { signature, ...latest_blockhash },
  //   "confirmed"
  // );
  return { quote, lower_tick_index, upper_tick_index };
}

export async function openPosition(
  ctx: WhirlpoolContext,
  client: WhirlpoolClient,
  quote: IncreaseLiquidityQuote,
  coin_a: CoinModel,
  coin_b: CoinModel,
  lower_tick_index: number,
  upper_tick_index: number
): Promise<TransactionBuilder> {
  const poolAddress = getPoolPubKey(coin_a.tokenSymbol, coin_b.tokenSymbol);
  console.log("open pos poolAddress:", poolAddress.toBase58());

  const whirlpool = await client.getPool(poolAddress);

  const current_postions: positionData[] = await getPositions(ctx, client);
  const findPosition = current_postions.filter((position) =>
    position.whirlpool.equals(poolAddress)
  );
  console.log("findPosition:", findPosition);
  if (findPosition.length === 0) {
    console.log("position not exist");

    const open_position_tx = await whirlpool.openPosition(
      lower_tick_index,
      upper_tick_index,
      quote
    );
    return open_position_tx.tx;
  }
  console.log("position needs increase liquidity");
  const position = await client.getPosition(findPosition[0].position);
  const increase_liquidity_tx = await position.increaseLiquidity(quote);
  return increase_liquidity_tx;
}

// async function open_whirl

export type positionData = {
  whirlpool: PublicKey;
  position: PublicKey;
  tickLowerIndex: number;
  tickUpperIndex: number;
  liquidity: string;
  positionMint: PublicKey;
  tokensThatCanBeWithdrawn: TokenAmounts;
  tokenA: PublicKey;
  tokenB: PublicKey;
};

export async function getPositions(
  ctx: WhirlpoolContext,
  client: WhirlpoolClient
): Promise<positionData[]> {
  console.log("wallet:", ctx.wallet.publicKey.toBase58());
  const token_accounts = (
    await ctx.connection.getTokenAccountsByOwner(ctx.wallet.publicKey, {
      programId: TOKEN_PROGRAM_ID,
    })
  ).value;

  // Get candidate addresses for the position
  const whirlpool_position_candidate_pubkeys = token_accounts
    .map((ta) => {
      const parsed = unpackAccount(ta.pubkey, ta.account);

      // Derive the address of Whirlpool's position from the mint address (whether or not it exists)
      const pda = PDAUtil.getPosition(ctx.program.programId, parsed.mint);

      // Output candidate info
      console.log(
        "TokenAccount:",
        ta.pubkey.toBase58(),
        "\n  mint:",
        parsed.mint.toBase58(),
        "\n  amount:",
        parsed.amount.toString(),
        "\n  pda:",
        pda.publicKey.toBase58()
      );

      // Returns the address of the Whirlpool position only if the number of tokens is 1 (ignores empty token accounts and non-NFTs)
      return new BN(parsed.amount.toString()).eq(new BN(1))
        ? pda.publicKey
        : undefined;
    })
    .filter((pubkey) => pubkey !== undefined);

  // Get data from Whirlpool position addresses
  const whirlpool_position_candidate_datas = await ctx.fetcher.getPositions(
    whirlpool_position_candidate_pubkeys,
    IGNORE_CACHE
  );
  // Leave only addresses with correct data acquisition as position addresses
  const whirlpool_positions = whirlpool_position_candidate_pubkeys.filter(
    (pubkey, i) => whirlpool_position_candidate_datas[i] !== null
  );
  console.log("whirlpool_positions:", whirlpool_positions);
  const positions_data: positionData[] = [];

  // Output the address of the positions
  // whirlpool_positions.map((position_pubkey) =>
  //   console.log("position:", position_pubkey.toBase58())
  // );
  for (let i = 0; i < whirlpool_positions.length; i++) {
    try {
      const p = whirlpool_positions[i];

      // Get the status of the position
      const position = await client.getPosition(p);
      const data = position.getData();

      // Get the pool to which the position belongs
      const pool = await client.getPool(data.whirlpool);
      const token_a = pool.getTokenAInfo();
      const token_b = pool.getTokenBInfo();
      const price = PriceMath.sqrtPriceX64ToPrice(
        pool.getData().sqrtPrice,
        token_a.decimals,
        token_b.decimals
      );

      // Get the price range of the position
      const lower_price = PriceMath.tickIndexToPrice(
        data.tickLowerIndex,
        token_a.decimals,
        token_b.decimals
      );
      const upper_price = PriceMath.tickIndexToPrice(
        data.tickUpperIndex,
        token_a.decimals,
        token_b.decimals
      );

      // Calculate the amount of tokens that can be withdrawn from the position
      const amounts: TokenAmounts = PoolUtil.getTokenAmountsFromLiquidity(
        data.liquidity,
        pool.getData().sqrtPrice,
        PriceMath.tickIndexToSqrtPriceX64(data.tickLowerIndex),
        PriceMath.tickIndexToSqrtPriceX64(data.tickUpperIndex),
        true
      );

      // Output the status of the position
      console.log("position:", i, p.toBase58());
      // console.log("\twhirlpool address:", data.whirlpool.toBase58());
      // console.log("\twhirlpool price:", price.toFixed(token_b.decimals));
      // console.log("\ttokenA:", token_a.mint.toBase58());
      // console.log("\ttokenB:", token_b.mint.toBase58());
      // console.log("\tliquidity:", data.liquidity.toString());
      // console.log("\t ");
      // console.log(
      //   "\tlower:",
      //   data.tickLowerIndex,
      //   lower_price.toFixed(token_b.decimals)
      // );
      // console.log(
      //   "\tupper:",
      //   data.tickUpperIndex,
      //   upper_price.toFixed(token_b.decimals)
      // );
      // console.log(
      //   "\tamountA:",
      //   DecimalUtil.fromBN(amounts.tokenA, token_a.decimals).toString()
      // );
      // console.log(
      //   "\tamountB:",
      //   DecimalUtil.fromBN(amounts.tokenB, token_b.decimals).toString()
      // );
      positions_data.push({
        whirlpool: data.whirlpool,
        position: p || new PublicKey(""),
        tickLowerIndex: data.tickLowerIndex,
        tickUpperIndex: data.tickUpperIndex,
        liquidity: data.liquidity.toString(),
        positionMint: data.positionMint,
        tokensThatCanBeWithdrawn: amounts,
        // positionOwner: data.rewardInfos[0],
        // positionTokenAccount: data.positionTokenAccount,
        tokenA: token_a.mint,
        tokenB: token_b.mint,
      });
    } catch (error) {
      continue;
    }
  }
  console.log("positions_data:", positions_data);
  return positions_data;
}

export async function closePosition(
  ctx: WhirlpoolContext,
  client: WhirlpoolClient,
  position_pubkey: PublicKey
): Promise<TransactionBuilder> {
  const slippage = Percentage.fromFraction(10, 1000); // 1%

  // Get the position and the pool to which the position belongs
  const position = await client.getPosition(position_pubkey);
  const position_owner = ctx.wallet.publicKey;
  const position_token_account = getAssociatedTokenAddressSync(
    position.getData().positionMint,
    position_owner
  );
  const whirlpool_pubkey = position.getData().whirlpool;
  const whirlpool = await client.getPool(whirlpool_pubkey);
  const whirlpool_data = whirlpool.getData();

  const token_a = whirlpool.getTokenAInfo();
  const token_b = whirlpool.getTokenBInfo();

  // Get TickArray and Tick
  const tick_spacing = whirlpool.getData().tickSpacing;
  const tick_array_lower_pubkey = PDAUtil.getTickArrayFromTickIndex(
    position.getData().tickLowerIndex,
    tick_spacing,
    whirlpool_pubkey,
    ctx.program.programId
  ).publicKey;
  const tick_array_upper_pubkey = PDAUtil.getTickArrayFromTickIndex(
    position.getData().tickUpperIndex,
    tick_spacing,
    whirlpool_pubkey,
    ctx.program.programId
  ).publicKey;

  // Create token accounts to receive fees and rewards
  // Collect mint addresses of tokens to receive
  const tokens_to_be_collected = new Set<string>();
  tokens_to_be_collected.add(token_a.mint.toBase58());
  tokens_to_be_collected.add(token_b.mint.toBase58());
  whirlpool.getData().rewardInfos.map((reward_info) => {
    if (PoolUtil.isRewardInitialized(reward_info)) {
      tokens_to_be_collected.add(reward_info.mint.toBase58());
    }
  });
  // Get addresses of token accounts and get instructions to create if it does not exist
  const required_ta_ix: Instruction[] = [];
  const token_account_map = new Map<string, PublicKey>();
  for (let mint_b58 of tokens_to_be_collected) {
    const mint = new PublicKey(mint_b58);
    // If present, ix is EMPTY_INSTRUCTION
    const { address, ...ix } = await resolveOrCreateATA(
      ctx.connection,
      position_owner,
      mint,
      () => ctx.fetcher.getAccountRentExempt()
    );
    required_ta_ix.push(ix);
    token_account_map.set(mint_b58, address);
  }

  // Build the instruction to update fees and rewards
  const update_fee_and_rewards_ix = WhirlpoolIx.updateFeesAndRewardsIx(
    ctx.program,
    {
      whirlpool: position.getData().whirlpool,
      position: position_pubkey,
      tickArrayLower: tick_array_lower_pubkey,
      tickArrayUpper: tick_array_upper_pubkey,
    }
  );
  const tokenOwnerAccountA = token_account_map.get(token_a.mint.toBase58());
  const tokenOwnerAccountB = token_account_map.get(token_b.mint.toBase58());
  if (!tokenOwnerAccountA || !tokenOwnerAccountB) {
    throw new Error("Token Owner Account not found");
  }
  // Build the instruction to collect fees
  const collect_fees_ix = WhirlpoolIx.collectFeesIx(ctx.program, {
    whirlpool: whirlpool_pubkey,
    position: position_pubkey,
    positionAuthority: position_owner,
    positionTokenAccount: position_token_account,
    tokenOwnerAccountA: tokenOwnerAccountA,
    tokenOwnerAccountB: tokenOwnerAccountB,
    tokenVaultA: whirlpool.getData().tokenVaultA,
    tokenVaultB: whirlpool.getData().tokenVaultB,
  });

  // Build the instructions to collect rewards
  const collect_reward_ix = [
    EMPTY_INSTRUCTION,
    EMPTY_INSTRUCTION,
    EMPTY_INSTRUCTION,
  ];
  for (let i = 0; i < whirlpool.getData().rewardInfos.length; i++) {
    const reward_info = whirlpool.getData().rewardInfos[i];
    if (!PoolUtil.isRewardInitialized(reward_info)) continue;

    const rewardOwnerAccount = token_account_map.get(
      reward_info.mint.toBase58()
    );
    if (!rewardOwnerAccount) {
      throw new Error("Reward Owner Account not found");
    }

    collect_reward_ix[i] = WhirlpoolIx.collectRewardIx(ctx.program, {
      whirlpool: whirlpool_pubkey,
      position: position_pubkey,
      positionAuthority: position_owner,
      positionTokenAccount: position_token_account,
      rewardIndex: i,
      rewardOwnerAccount: rewardOwnerAccount,
      rewardVault: reward_info.vault,
    });
  }

  // Estimate the amount of tokens that can be withdrawn from the position
  const quote = decreaseLiquidityQuoteByLiquidityWithParams({
    // Pass the pool state as is
    sqrtPrice: whirlpool_data.sqrtPrice,
    tickCurrentIndex: whirlpool_data.tickCurrentIndex,
    // Pass the price range of the position as is
    tickLowerIndex: position.getData().tickLowerIndex,
    tickUpperIndex: position.getData().tickUpperIndex,
    // Liquidity to be withdrawn (All liquidity)
    liquidity: position.getData().liquidity,
    // Acceptable slippage
    slippageTolerance: slippage,
  });

  // Output the estimation
  console.log(
    "devSAMO min output:",
    DecimalUtil.fromBN(quote.tokenMinA, token_a.decimals).toFixed(
      token_a.decimals
    )
  );
  console.log(
    "devUSDC min output:",
    DecimalUtil.fromBN(quote.tokenMinB, token_b.decimals).toFixed(
      token_b.decimals
    )
  );

  // Build the instruction to decrease liquidity
  const decrease_liquidity_ix = WhirlpoolIx.decreaseLiquidityIx(ctx.program, {
    ...quote,
    whirlpool: whirlpool_pubkey,
    position: position_pubkey,
    positionAuthority: position_owner,
    positionTokenAccount: position_token_account,
    tokenOwnerAccountA: tokenOwnerAccountA,
    tokenOwnerAccountB: tokenOwnerAccountB,
    tokenVaultA: whirlpool.getData().tokenVaultA,
    tokenVaultB: whirlpool.getData().tokenVaultB,
    tickArrayLower: tick_array_lower_pubkey,
    tickArrayUpper: tick_array_upper_pubkey,
  });

  // Build the instruction to close the position
  const close_position_ix = WhirlpoolIx.closePositionIx(ctx.program, {
    position: position_pubkey,
    positionAuthority: position_owner,
    positionTokenAccount: position_token_account,
    positionMint: position.getData().positionMint,
    receiver: position_owner,
  });

  // Create a transaction and add the instruction
  const tx_builder = new TransactionBuilder(ctx.connection, ctx.wallet);
  // Create token accounts
  required_ta_ix.map((ix) => tx_builder.addInstruction(ix));
  tx_builder
    // Update fees and rewards, collect fees, and collect rewards
    .addInstruction(update_fee_and_rewards_ix)
    .addInstruction(collect_fees_ix)
    .addInstruction(collect_reward_ix[0])
    .addInstruction(collect_reward_ix[1])
    .addInstruction(collect_reward_ix[2])
    // Decrease liquidity
    .addInstruction(decrease_liquidity_ix)
    // Close the position
    .addInstruction(close_position_ix);

  // Send the transaction

  // const signature = await tx_builder.buildAndExecute();
  // console.log("signature:", signature);

  // // Wait for the transaction to complete
  // const latest_blockhash = await ctx.connection.getLatestBlockhash();
  // await ctx.connection.confirmTransaction(
  //   { signature, ...latest_blockhash },
  //   "confirmed"
  // );

  return tx_builder;
}
