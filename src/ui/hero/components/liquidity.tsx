import { useEffect, useMemo, useState } from "react";
import { CoinModel } from "../../../util/coinModel";
import { coins } from "../../../util/devCoins";
import Modal from "../../modal/modal";
import { useWallet } from "@solana/wallet-adapter-react";
import { getCoin, network, networkUrl } from "../../../util/constants";
import { Connection, PublicKey } from "@solana/web3.js";
import { SetupWhirlpool } from "../../../util/whirlpool_setup";
import {
  BlanceDetails,
  getTokenBalanceByMint,
} from "../../../util/getBalances";
import {
  closePosition,
  getPoolQuote,
  getPositions,
  openPosition,
  positionData,
} from "../../../util/liquidity_pool";
import {
  IncreaseLiquidityQuote,
  WhirlpoolClient,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { DecimalUtil } from "@orca-so/common-sdk";
import { toast } from "react-toastify";

const Liquidity = () => {
  const [fromAsset, setFromAsset] = useState<CoinModel>(coins[0]);
  const [toAsset, setToAsset] = useState<CoinModel>(coins[1]);
  const [open1stCoin, setOpen1stCoin] = useState(false);
  const [open2ndCoin, setOpen2ndCoin] = useState(false);
  const [maxBalance, setMaxBalance] = useState<number>(0);
  const [maxBalance2, setMaxBalance2] = useState<number>(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const [loading, setLoading] = useState<boolean>(false);
  const [positionLoading, setPositionLoading] = useState<boolean>(false);
  const [quote, setQuote] = useState<IncreaseLiquidityQuote | null>(null);
  const [positions, setPositions] = useState<positionData[]>([]);
  const [ctx, setCtx] = useState<WhirlpoolContext | null>(null);
  const [client, setClient] = useState<WhirlpoolClient | null>(null);
  const [lower_tick_index, setLowerTickIndex] = useState<number>(0);
  const [upper_tick_index, setUpperTickIndex] = useState<number>(0);
  const [withdrawLoadingArray, setWithdrawLoadingArray] = useState<boolean[]>(
    []
  );

  const wallet = useWallet();
  const connection = useMemo(() => new Connection(networkUrl, "confirmed"), []);

  useEffect(() => {
    if (wallet) {
      SetupWhirlpool(wallet).then(({ ctx, client }) => {
        setCtx(ctx);
        setClient(client);
      });
    }
  }, [wallet]);

  // get max balance of the selected token
  useEffect(() => {
    if (wallet && connection) {
      getTokenBalanceByMint(
        wallet.publicKey!,
        connection,
        fromAsset.mintAddress
      ).then((data: BlanceDetails) => {
        setMaxBalance(Number(data.ui_amount));
      });
    } else {
      setMaxBalance(0);
    }
  }, [fromAsset, connection, wallet, positions]);

  useEffect(() => {
    if (wallet && connection) {
      getTokenBalanceByMint(
        wallet.publicKey!,
        connection,
        toAsset.mintAddress
      ).then((data: BlanceDetails) => {
        setMaxBalance2(Number(data.ui_amount));
      });
    } else {
      setMaxBalance2(0);
    }
  }, [toAsset, connection, wallet, positions]);

  // get quote from whirlpool on change of fromAsset or toAsset
  useEffect(() => {
    getQuoteFromWhirlpool();
  }, [fromAsset, toAsset]);

  useEffect(() => {
    if (client) {
      setPositionLoading(true);
      getPositionsFromPool();
    }
  }, [client]);

  // get quote from whirlpool on input change
  const handleInputChange = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const newTimeoutId = setTimeout(() => {
      getQuoteFromWhirlpool();
    }, 500);
    setTimeoutId(newTimeoutId);
  };
  const CustomToastToOpenLink = (transactionId: string) => {
    return (
      <div className="">
        <a
          href={`https://solscan.io/tx/${transactionId}?cluster=${network}`}
          target="_blank"
          rel="noreferrer"
        >
          Transaction Successful Click to view transaction
        </a>
      </div>
    );
  };

  // get quote from whirlpool
  async function getQuoteFromWhirlpool() {
    if (!ctx || !client) {
      return;
    }
    const amount: number = getInputAmount();

    if (amount === 0) {
      setOutputAmount(0);
      return;
    }
    console.log("getting quote");
    try {
      const { quote, lower_tick_index, upper_tick_index } = await getPoolQuote(
        client,
        fromAsset,
        toAsset,
        amount
      );
      setQuote(quote);
      setOutputAmount(
        Number(DecimalUtil.fromBN(quote.tokenEstB, toAsset.decimals))
      );
      setLowerTickIndex(lower_tick_index);
      setUpperTickIndex(upper_tick_index);
    } catch (e) {
      console.log("Error getting quote", e);
      setQuote(null);
      setOutputAmount(0);
    }
  }

  async function openPositionAndAddLiquidity() {
    if (!ctx || !client || !quote || loading || !wallet) {
      return;
    }
    console.log(
      "quote:",
      quote.tokenEstA.toString(),
      quote.tokenEstB.toString()
    );
    if (
      Number(DecimalUtil.fromBN(quote.tokenEstB, toAsset.decimals)) >
        maxBalance2 ||
      Number(DecimalUtil.fromBN(quote.tokenEstA, fromAsset.decimals)) >
        maxBalance
    ) {
      toast.error("Insufficient Balance");
      return;
    }
    setLoading(true);
    try {
      const transaction = await openPosition(
        ctx,
        client,
        quote,
        fromAsset,
        toAsset,
        lower_tick_index,
        upper_tick_index
      );
      const signature = await transaction.buildAndExecute();
      console.log("signature:", signature);

      // Wait for the transaction to complete
      const latest_blockhash = await ctx.connection.getLatestBlockhash();
      await ctx.connection.confirmTransaction(
        { signature, ...latest_blockhash },
        "confirmed"
      );
      toast.success(CustomToastToOpenLink(signature));
      setPositionLoading(true);
      getPositionsFromPool();

      setLoading(false);
    } catch (e) {
      console.log("Error opening position", e);
      toast.error("Error opening position");
      setLoading(false);
    }
  }

  async function closePoolAndWithdraw(position_key: PublicKey, index: number) {
    if (!ctx || !client || loading || !wallet) {
      return;
    }
    try {
      setWithdrawLoadingArray((prev) => {
        const temp = [...prev];
        temp[index] = true;
        return temp;
      });
      const transaction = await closePosition(ctx, client, position_key);
      const signature = await transaction.buildAndExecute();
      console.log("signature:", signature);

      // Wait for the transaction to complete
      const latest_blockhash = await ctx.connection.getLatestBlockhash();
      await ctx.connection.confirmTransaction(
        { signature, ...latest_blockhash },
        "confirmed"
      );
      toast.success(CustomToastToOpenLink(signature));
      setPositionLoading(true);
      getPositionsFromPool();
    } catch (e) {
      console.log("Error closing position", e);
      toast.error("Error in Withdrawal");
      setWithdrawLoadingArray((prev) => {
        const temp = [...prev];
        temp[index] = false;
        return temp;
      });
    }
  }

  async function getPositionsFromPool(): Promise<positionData[]> {
    try {
      setPositionLoading(true);
      const positions = await getPositions(ctx!, client!);
      console.log("positions", positions);
      setPositions(positions);
      setPositionLoading(false);
      for (let i = 0; i < positions.length; i++) {
        setWithdrawLoadingArray((prev) => [...prev, false]);
      }
      return positions;
    } catch {
      console.log("Error getting positions");
      setPositionLoading(false);
      return [];
    }
  }

  function getInputAmount(): number {
    try {
      const inputAmount = document.getElementById(
        "fromAssetInputLiquidty"
      ) as HTMLInputElement;
      return Number(inputAmount.value);
    } catch {
      return 0;
    }
  }

  function setOutputAmount(amount: number) {
    try {
      const outputAmount = document.getElementById(
        "toAssetInputLiquidty"
      ) as HTMLInputElement;
      outputAmount.value = amount.toString();
    } catch {
      return 0;
    }
  }

  const handlefirstInput = () => {
    setOpen2ndCoin(false);
    setOpen1stCoin((prev) => !prev);
  };

  const handleSecondInput = () => {
    setOpen1stCoin(false);
    setOpen2ndCoin((prev) => !prev);
  };

  const handleModelOne = async (data: number) => {
    if (toAsset.mintAddress === coins[data].mintAddress) {
      const tempAsset = fromAsset;
      setFromAsset(toAsset);
      setToAsset(tempAsset);
    } else {
      setFromAsset(coins[data]);
    }
  };

  const handleModelTwo = (data: number) => {
    if (fromAsset.mintAddress === coins[data].mintAddress) {
      const tempAsset = fromAsset;
      setFromAsset(toAsset);
      setToAsset(tempAsset);
    } else {
      setToAsset(coins[data]);
    }
  };

  return (
    <>
      {open2ndCoin && (
        <Modal
          onSetData={handleModelTwo}
          closeHandler={() => setOpen2ndCoin(false)}
          assets={coins}
        />
      )}
      {open1stCoin && (
        <Modal
          onSetData={handleModelOne}
          closeHandler={() => setOpen1stCoin(false)}
          assets={coins}
        />
      )}
      <form
        action=""
        id="form"
        className="w-full pb-10 pt-8 px-6 rounded-3xl  select-none"
      >
        <div className="text-base text-gray-300"></div>

        <div className="input flexBetween gap-4 h-20 px-4 rounded-xl ">
          <div
            onClick={handlefirstInput}
            className="min-w-28 flexBetween cursor-pointer select-none "
          >
            <div className="flex items-center">
              <img
                className="Image h-8 w-8 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                src={fromAsset.icon}
                alt={fromAsset.tokenSymbol}
              />
              <div className="pr-2"></div>
              <div className="text-base font-medium text-white">
                {fromAsset.tokenSymbol}
              </div>
            </div>
            <svg
              name="chevron-down"
              className={open1stCoin ? " rotate-180" : ""}
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path
                d="M16.293 9.29297L12 13.586L7.70697 9.29297L6.29297 10.707L12 16.414L17.707 10.707L16.293 9.29297Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="h-8 w-[1px] bg-[rgba(255,255,255,0.2)]" />

          <input
            name="fiat"
            type="number"
            onChange={handleInputChange}
            id="fromAssetInputLiquidty"
            required
            className="outline-none h-full font-medium text-base text-white p-0 bg-transparent w-full rounded-br-xl rounded-tr-xl"
          />
        </div>
        <div className="text-white my-1 mx-2 w-full"></div>
        <div className="relative h-8 my-4">
          <div className="Row flex absolute h-full items-center transition-all left-4">
            <div className="Icon grid h-max w-max p-1 text-[#39D0D8]"></div>
            <div className="opacity-100">
              <div
                className="transition-all duration-200 ease overflow-hidden"
                style={{ transition: "all 200ms ease 0s" }}
              >
                <div className="Row flex  font-medium text-sm text-[#ABC4FF] w-max">
                  Max : {maxBalance}
                  {/* <div className="ml-2 clickable">⇋</div> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-base text-gray-300 pt-1 "></div>

        <div className="input flexBetween gap-4 h-20 px-4 rounded-xl ">
          <div
            onClick={handleSecondInput}
            className="min-w-28 flexBetween cursor-pointer select-none "
          >
            <div className="flex items-center">
              <img
                className="Image h-8 w-8 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                src={toAsset.icon}
                alt={toAsset.tokenSymbol}
              />
              <div className="pr-2"></div>
              <div className="text-base font-medium text-white">
                {toAsset.tokenSymbol}
              </div>
            </div>
            <svg
              name="chevron-down"
              className={open2ndCoin ? " rotate-180" : ""}
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path
                d="M16.293 9.29297L12 13.586L7.70697 9.29297L6.29297 10.707L12 16.414L17.707 10.707L16.293 9.29297Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="h-8 w-[1px] bg-[rgba(255,255,255,0.2)]" />
          <input
            name="fiat"
            type="number"
            id="toAssetInputLiquidty"
            className="outline-none h-full font-medium text-base text-white p-0 bg-transparent w-full rounded-br-xl rounded-tr-xl"
            disabled
          />
          {/* {open2ndCoin && <Modal />} */}
          <div></div>
        </div>
        <div className="opacity-100 mt-4 mb-4">
          <div
            className="transition-all duration-200 ease overflow-hidden"
            style={{ transition: "all 200ms ease 0s" }}
          >
            <div className="Row flex  font-medium text-sm text-[#ABC4FF] w-max ml-5">
              Max : {maxBalance2}
            </div>
          </div>
        </div>
        <div className="inputBox flexCenter">
          <button
            type="button"
            id="exchangeBtn"
            className="border-2 p-auto"
            onClick={openPositionAndAddLiquidity}
          >
            {loading ? (
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              ></div>
            ) : getInputAmount() === 0 ? (
              "Enter an amount"
            ) : !quote ? (
              "Fetching ...."
            ) : (
              "Add Liquidity"
            )}
          </button>
        </div>
      </form>
      <div className="mt-12 max-w-[456px] self-center">
        <div className="mb-6 text-xl font-medium text-white">
          Your Liquidity
        </div>
        <div className="Card rounded-3xl p-6 mt-6 mobile:py-5 mobile:px-3 bg-cyberpunk-card-bg">
          <div className="Col List overflow-y-scroll flex flex-col gap-6 mobile:gap-5" />
          {/* <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
            If you staked your LP tokens in a farm, unstake them to see them
            here
          </div> */}
          {positionLoading && (
            <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
              Loading...
            </div>
          )}
          {positions.map((position, index) => {
            const coin1 = getCoin(position.tokenA);
            const coin2 = getCoin(position.tokenB);
            return (
              <div
                key={index}
                className="flex  flex-col  items-center gap-4 text-white m-2 mb-4 border-2 rounded-lg p-2"
              >
                <div className="flex  items-center">
                  <img
                    className="Image h-8 w-8 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                    src={coin1?.icon}
                    alt={coin2?.tokenSymbol}
                  />
                  <img
                    className="Image h-8 w-8 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                    src={coin2?.icon}
                    alt={coin2?.tokenSymbol}
                  />
                  {coin1?.tokenSymbol} - {coin2?.tokenSymbol}
                </div>
                <div>
                  <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
                    Liquidity: {position.liquidity}
                  </div>
                </div>
                <div>
                  <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
                    {coin1?.tokenSymbol}
                    {": "}
                    {DecimalUtil.fromBN(
                      position.tokensThatCanBeWithdrawn.tokenA,
                      coin1?.decimals
                    ).toFixed(coin1?.decimals)}
                  </div>
                </div>
                <div>
                  <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
                    {coin2?.tokenSymbol}
                    {": "}
                    {DecimalUtil.fromBN(
                      position.tokensThatCanBeWithdrawn.tokenB,
                      coin2?.decimals
                    ).toFixed(coin2?.decimals)}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (withdrawLoadingArray[index]) {
                        return;
                      }
                      closePoolAndWithdraw(position.position, index);
                    }}
                    className="Button bg-white  border-2 select-none justify-center gap-2 px-4 py-2.5 rounded-xl mobile:rounded-lg font-medium whitespace-nowrap appearance-none bg-formkit-thumb text-formkit-thumb-text-normal clickable clickable-filter-effect flex items-center frosted-glass-teal opacity-80"
                  >
                    <div>
                      {withdrawLoadingArray[index] ? "Loading..." : "Withdraw"}
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-12 max-w-[456px] self-center">
        <div className="mb-6 text-xl font-medium text-white">Create Pool</div>
        <div className="Card rounded-3xl p-6 mt-6 mobile:py-5 mobile:px-3 bg-cyberpunk-card-bg">
          <div className="Row flex gap-4">
            <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
              Create a liquidity pool on Raydium that can be traded on the swap
              interface.{/* */}{" "}
              <a
                tabIndex={0}
                rel="nofollow noopener noreferrer"
                target="_blank"
                className="Link clickable text-[rgba(171,196,255)] hover:underline"
                href="https://raydium.gitbook.io/raydium/permissionless/creating-a-pool"
              >
                Read the guide
              </a>{" "}
              {/* */}before attempting.
            </div>
            <button className="Button select-none justify-center gap-2 px-4 py-2.5 rounded-xl mobile:rounded-lg font-medium whitespace-nowrap appearance-none bg-formkit-thumb text-formkit-thumb-text-normal clickable clickable-filter-effect flex items-center frosted-glass-teal opacity-80">
              <div className="Icon grid h-max w-max mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="select-none h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <div>Create Pool</div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Liquidity;
