import { PublicKey, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { DecimalUtil } from "@orca-so/common-sdk";
import { coins } from "../ui/hero/components/coins";
import BN from "bn.js";

export type BlanceDetails = {
  tokenName: string;
  amount: string;
  ui_amount: string;
  mint_address: string;
  is_token_mint: boolean;
};

export type PriorityFee = {
  min: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  unsafeMax: number;
};

export async function getAllTokensByOwner(
  publicKey: PublicKey,
  connection: Connection
): Promise<BlanceDetails[]> {
  const accounts = await connection.getTokenAccountsByOwner(publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });
  console.log("getTokenAccountsByOwner:", accounts);

  // Get the token definitions
  const token_defs = coins;

  const balances: BlanceDetails[] = [];

  for (let i = 0; i < accounts.value.length; i++) {
    const value = accounts.value[i];

    // Deserialize
    const parsed_token_account = unpackAccount(value.pubkey, value.account);
    // Use the mint address to determine which token account is for which token
    const mint = parsed_token_account.mint;
    const token_def = token_defs.find((t) => t.mintAddress === mint.toBase58());
    // Ignore non-devToken accounts
    if (token_def === undefined) continue;

    // The balance is "amount"
    const amount = parsed_token_account.amount;
    // The balance is managed as an integer value, so it must be converted for UI display
    const ui_amount = DecimalUtil.fromBN(
      new BN(amount.toString()),
      token_def.decimals
    );
    balances.push({
      tokenName: token_def.tokenName,
      amount: amount.toString(),
      ui_amount: ui_amount.toString(),
      mint_address: mint.toBase58(),
      is_token_mint: true,
    });

    console.log(
      "TokenAccount:",
      value.pubkey.toBase58(),
      "\n  mint:",
      mint.toBase58(),
      "\n  name:",
      token_def.tokenName,
      "\n  amount:",
      amount.toString(),
      "\n  ui_amount:",
      ui_amount.toString()
    );
  }
  return balances;
}

export async function getTokenBalanceByMint(
  publicKey: PublicKey,
  connection: Connection,
  mintAddress: string
): Promise<BlanceDetails> {
  const accounts = await getAllTokensByOwner(publicKey, connection);
  const account = accounts.find((a) => a.mint_address === mintAddress);
  if (account === undefined) {
    return {
      tokenName:
        coins.find((t) => t.mintAddress === mintAddress)?.tokenName ||
        "Unknown",
      amount: "0",
      ui_amount: "0",
      mint_address: mintAddress,
      is_token_mint: false,
    };
  }
  return account;
}

const url = `https://mainnet.helius-rpc.com/?api-key=5839e6aa-7ba3-44d2-99ca-2ead557ec729`;

export const getRecentPrioritizationFees = async (): Promise<PriorityFee> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getPriorityFeeEstimate",
      params: [
        {
          accountKeys: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
          options: {
            includeAllPriorityFeeLevels: true,
          },
        },
      ],
    }),
  });
  const data = await response.json();
  console.log("Fee: ", data);
  return {
    min: data.result.min,
    low: data.result.low,
    medium: data.result.medium,
    high: data.result.high,
    veryHigh: data.result.veryHigh,
    unsafeMax: data.result.unsafeMax,
  };
};
