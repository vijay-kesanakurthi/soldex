import { useState, useEffect, useMemo } from "react";
import "./exchange-card.scss";
import Modal from "../../modal/modal";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { coins } from "../../../util/devCoins";
import { CoinModel } from "../../../util/coinModel";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Liquidity from "./liquidity";
import {
  getTokenBalanceByMint,
  BlanceDetails,
} from "../../../util/getBalances";
import { SetupWhirlpool } from "../../../util/whirlpool_setup";
import { getSwapQuote, swapTokens, getPoolPubKey } from "../../../util/swap";

import { networkUrl, network } from "../../../util/constants";
import {
  SwapQuote,
  WhirlpoolClient,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";

const Card = () => {
  const [fromAsset, setFromAsset] = useState<CoinModel>(coins[0]);
  const [toAsset, setToAsset] = useState<CoinModel>(coins[1]);
  const [open1stCoin, setOpen1stCoin] = useState(false);
  const [open2ndCoin, setOpen2ndCoin] = useState(false);
  const [maxBalance, setMaxBalance] = useState<number>(0);
  const [selectButton, setSelectButton] = useState("Swap");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const [loading, setLoading] = useState<boolean>(false);
  const [whirlpoolPublicKey, setWhirlpoolPublicKey] = useState<PublicKey>();
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [ctx, setCtx] = useState<WhirlpoolContext | null>(null);
  const [client, setClient] = useState<WhirlpoolClient | null>(null);

  const connection = useMemo(() => new Connection(networkUrl, "confirmed"), []);
  const { publicKey } = useWallet();
  const wallet = useWallet();

  // setup whirlpool
  useEffect(() => {
    if (publicKey && wallet) {
      SetupWhirlpool(wallet).then(({ ctx, client }) => {
        setCtx(ctx);
        setClient(client);
      });
    }
  }, [publicKey, wallet]);

  // get whirlpool pubkey of the selected pair
  useEffect(() => {
    // getWhirlpoolPubkey(
    //   new PublicKey(fromAsset.mintAddress),
    //   new PublicKey(toAsset.mintAddress),
    //   64
    // ).then((pubkey) => {
    //   setWhirlpoolPublicKey(pubkey);
    // });
    const result = getPoolPubKey(fromAsset.tokenSymbol, toAsset.tokenSymbol);
    console.log("whirlpoolKey:", result);
    setWhirlpoolPublicKey(result);
  }, [fromAsset, toAsset]);

  // get max balance of the selected token
  useEffect(() => {
    console.log("fromAsset", fromAsset);
    if (publicKey && connection) {
      getTokenBalanceByMint(publicKey, connection, fromAsset.mintAddress).then(
        (data: BlanceDetails) => {
          setMaxBalance(Number(data.ui_amount));
        }
      );
    } else {
      setMaxBalance(0);
    }
  }, [fromAsset, publicKey, connection]);

  // get quote from whirlpool on change of fromAsset or toAsset
  useEffect(() => {
    getQuoteFromWhirlpool();
  }, [fromAsset, toAsset, whirlpoolPublicKey]);

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

  // get quote from whirlpool
  async function getQuoteFromWhirlpool() {
    if (!whirlpoolPublicKey || !ctx || !client) {
      return;
    }
    if (getInputAmount() === 0) {
      setOutputAmount(0);
      return;
    }
    try {
      const quote = await getSwapQuote(
        new PublicKey(fromAsset.mintAddress),
        getInputAmount() * 10 ** fromAsset.decimals,
        // USDC_USDT,
        whirlpoolPublicKey,
        ctx,
        client
      );
      console.log(quote);
      setQuote(quote);
      setOutputAmount(
        quote.estimatedAmountOut.toNumber() / 10 ** toAsset.decimals
      );
    } catch (e) {
      console.log("Error getting quote", e);
      setQuote(null);
      setOutputAmount(0);
    }
  }

  // swap tokens
  async function swapFromWhirlpool() {
    toast.dismiss();
    if (!whirlpoolPublicKey || !ctx || !client) {
      return;
    }
    if (!quote) {
      toast.error("No quote found");
      return;
    }

    try {
      setLoading(true);
      const signature = await swapTokens(
        ctx,
        client,
        whirlpoolPublicKey,
        quote
      );
      // const signature = await swapTokens(ctx, client, USDC_USDT, quote);
      console.log("signature", signature);
      toast.success(CustomToastToOpenLink(signature));
      getTokenBalanceByMint(
        publicKey || new PublicKey(""),
        connection,
        fromAsset.mintAddress
      ).then((data: BlanceDetails) => {
        setMaxBalance(Number(data.ui_amount));
      });
    } catch (e) {
      console.log("Error swapping tokens", e);
      toast.error("Error swapping tokens");
    } finally {
      setLoading(false);
    }
  }

  const handlefirstInput = () => {
    setOpen2ndCoin(false);
    setOpen1stCoin((prev) => !prev);
  };

  const swapHandler = () => {
    const tempAsset = fromAsset;
    if (loading) return;
    setFromAsset(toAsset);
    setToAsset(tempAsset);
    setOpen1stCoin(false);
    setOpen2ndCoin(false);
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
    console.log(data);
  };

  const handleModelTwo = (data: number) => {
    if (fromAsset.mintAddress === coins[data].mintAddress) {
      const tempAsset = fromAsset;
      setFromAsset(toAsset);
      setToAsset(tempAsset);
    } else {
      setToAsset(coins[data]);
    }
    console.log(data);
  };

  const CustomToastToOpenLink = (transactionId: string) => {
    return (
      <div className="">
        <a
          href={`https://solscan.io/tx/${transactionId}?cluster=${network}`}
          target="_blank"
          rel="noreferrer"
        >
          Token swapped successfully Click to view transaction
        </a>
      </div>
    );
  };

  function getInputAmount(): number {
    try {
      const inputAmount = document.getElementById(
        "fromAssetInput"
      ) as HTMLInputElement;
      return Number(inputAmount.value);
    } catch {
      return 0;
    }
  }

  function setOutputAmount(amount: number) {
    try {
      const outputAmount = document.getElementById(
        "toAssetInput"
      ) as HTMLInputElement;
      outputAmount.value = amount.toString();
    } catch {
      return 0;
    }
  }

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
      <div
        className="flex rounded-full w-1/2 lg:w-1/3 mx-auto p-1 bg-cyberpunk-card-bg"
        id="headlessui-radiogroup-:r1:"
        role="radiogroup"
      >
        <div
          className="cursor-pointer flex grow"
          id="headlessui-radiogroup-option-:r2:"
          role="radio"
          aria-checked="true"
          tabIndex={0}
          data-headlessui-state="checked"
          onClick={() => setSelectButton("Swap")}
        >
          <div
            className="grid grow place-items-center  mobile:min-w-[76px] px-3 mobile:px-2 h-9 mobile:h-7 text-sm mobile:text-xs rounded-full  font-medium whitespace-nowrap text-white"
            style={{
              background:
                selectButton === "Swap"
                  ? "linear-gradient(245.22deg, rgb(218, 46, 239), rgb(43, 106, 255), rgb(57, 208, 216)) 0% center / 200% 100%"
                  : "",
            }}
          >
            Swap
          </div>
        </div>
        <div
          className="cursor-pointer flex grow"
          id="headlessui-radiogroup-option-:r3:"
          role="radio"
          aria-checked="false"
          tabIndex={-1}
          data-headlessui-state=""
          onClick={() => setSelectButton("Liquidity")}
        >
          <div
            className="grid grow place-items-center  mobile:min-w-[76px] px-3 mobile:px-2 h-9 mobile:h-7 text-sm mobile:text-xs  rounded-full  font-medium whitespace-nowrap text-[#ABC4FF]"
            style={{
              background:
                selectButton === "Liquidity"
                  ? "linear-gradient(245.22deg, rgb(218, 46, 239), rgb(43, 106, 255), rgb(57, 208, 216)) 0% center / 200% 100%"
                  : "",
            }}
          >
            Liquidity
          </div>
        </div>
      </div>
      <div className="right_contact mx-auto mt-11">
        {selectButton === "Swap" && (
          <>
            <form
              action=""
              id="form"
              className="w-full pb-10 pt-8 px-6 rounded-3xl  select-none"
            >
              <div className="text-base text-gray-300">From</div>

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
                      {/* {fromCurrency || "Select Fiat"}
                       */}
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
                  id="fromAssetInput"
                  required
                  disabled={loading}
                  className={`outline-none h-full font-medium text-base ${"text-white"} p-0 bg-transparent w-full rounded-br-xl rounded-tr-xl`}
                  onChange={handleInputChange}
                />
              </div>
              {/* max tokens will be shown here at the end*/}
              {publicKey && (
                <div className="text-white my-1  w-full text-right">
                  Max: {maxBalance.toString()}
                </div>
              )}

              <div className="text-white my-1 mx-2 w-full"></div>
              <div className="flexCenter">
                <div
                  className="mt-5 border-2 p-2 rounded-md border-dotted cursor-pointer hover:bg-white hover:scale-110"
                  onClick={swapHandler}
                >
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.772864 3.24846C0.457408 3.24846 0.173615 3.07952 0.0558748 2.82164C-0.0618654 2.56376 0.0100831 2.26871 0.237649 2.07621L2.46776 0.189733C2.76682 -0.0632443 3.23913 -0.0632443 3.53819 0.189733L5.7683 2.07621C5.99587 2.26871 6.06782 2.56376 5.95008 2.82164C5.83234 3.07952 5.54854 3.24846 5.23309 3.24846H3.77583L3.77583 11.2363C3.77583 11.6124 3.42982 11.9173 3.00299 11.9173C2.57616 11.9173 2.23015 11.6124 2.23015 11.2363V3.24846H0.772864Z"
                      fill="#00C26F"
                    ></path>
                    <path
                      d="M15.2271 8.75154C15.5426 8.75154 15.8264 8.92048 15.9441 9.17836C16.0619 9.43624 15.9899 9.73129 15.7624 9.92379L13.5322 11.8103C13.2332 12.0632 12.7609 12.0632 12.4618 11.8103L10.2317 9.92379C10.0041 9.73129 9.93219 9.43624 10.0499 9.17836C10.1677 8.92048 10.4515 8.75154 10.7669 8.75154H12.224L12.224 0.680991C12.224 0.30489 12.57 0 12.9969 0C13.4237 0 13.7697 0.30489 13.7697 0.680991L13.7697 8.75154H15.2271Z"
                      fill="#00C26F"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="text-base text-gray-300 pt-1 ">To</div>

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
                  id="toAssetInput"
                  className={`outline-none h-full font-medium text-base text-white p-0 bg-transparent w-full rounded-br-xl rounded-tr-xl`}
                  disabled
                />
                {/* {open2ndCoin && <Modal />} */}
                <div></div>
              </div>
              {/* {quote && quote.routePlan && ( 
                // <div className="flex flex-row items-center text-white justify-between mt-3">
                //    <label className="text-sm font-medium text-white">
                //     Route
                //   </label> 
                //   <div className="flex items-center"></div>
                //   <div className="flex items-center">
                //     {quote &&
                //       quote.routePlan &&
                //       quote.routePlan.map((item: any, index: number) => (
                //         <React.Fragment key={index}>
                //           <label className="text-sm font-medium text-white">
                //             {item.swapInfo.label}({item.percent}%)
                //           </label>
                //           {index < quote.routePlan.length - 1 && (
                //             <span className="mx-2 text-white">&#8594;</span>
                //           )}
                //         </React.Fragment>
                //       ))}
                //   </div>
                // </div>
              // )}
               onhover disable */}
              <div className="inputBox flexCenter">
                {
                  <button
                    type="button"
                    id="exchangeBtn"
                    disabled={!publicKey}
                    className={`border-2 p-auto ${
                      loading ||
                      maxBalance < getInputAmount() ||
                      !quote ||
                      getInputAmount() === 0
                        ? "hover:cursor-not-allowed opacity-50"
                        : "hover:cursor-pointer opacity-100"
                    }`}
                    onClick={async () => {
                      if (loading) return;
                      if (maxBalance < getInputAmount()) {
                        return;
                      }
                      if (getInputAmount() === 0) {
                        return;
                      }
                      await swapFromWhirlpool();
                      return;
                    }}
                  >
                    {loading ? (
                      <div
                        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      ></div>
                    ) : publicKey ? (
                      "Swap"
                    ) : (
                      "Connect Wallet"
                    )}
                  </button>
                }
              </div>
            </form>
            <div className="Card rounded-3xl flex visible flex-col mt-10 p-2 w-[min(456px,100%)] self-center bg-cyberpunk-card-bg">
              <div>
                <div className="opacity-100">
                  <div
                    className="transition-all duration-200 ease overflow-hidden"
                    style={{ transition: "all 200ms ease 0s" }}
                  >
                    <div className="flex mobile:grid mobile:grid-cols-3 mobile:gap-1 p-4 mobile:p-2 w-[min(456px,100%)] self-center items-center">
                      <div className="Row flex items-center mobile:justify-self-center w-16 mobile:w-8 flex-shrink-0">
                        <div className="Col flex flex-col gap-1 grow mobile:items-center">
                          <div className="CoinAvatar flex items-center    ">
                            <div
                              className="h-6 w-6  rounded-full"
                              style={{
                                background:
                                  "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                              }}
                            >
                              <img
                                className="Image h-6 w-6 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                                src="https://img.raydium.io/icon/So11111111111111111111111111111111111111112.png"
                                alt="So111111111111111111"
                              />
                            </div>
                          </div>
                          <div className="font-medium text-sm text-[#abc4ff]">
                            SOL
                          </div>
                        </div>
                      </div>
                      <div className="Col flex flex-col items-end mobile:items-center mobile:justify-self-center mobile:ml-0 grow">
                        <div className="text-xs font-medium text-[rgba(171,196,255,0.5)]">
                          Price
                        </div>
                        <div className="text-sm font-medium text-[#abc4ff] whitespace-nowrap">
                          $81.81
                        </div>
                      </div>
                      <div className="Col flex flex-col items-start mobile:items-center mobile:justify-self-center ml-8 mobile:ml-0 w-8">
                        <div className="text-xs font-medium text-[rgba(171,196,255,0.5)]">
                          24H%
                        </div>
                        <div className="text-sm font-medium text-[#DA2EEF]">
                          -7.75%
                        </div>
                      </div>
                      <svg
                        className="ml-10 w-36 mobile:w-full h-12 mobile:col-span-full  mobile:m-0 mobile:mt-2 flex-shrink-0"
                        viewBox="0 0 2000 1000"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <filter id="k-line-glow-negative">
                            <feFlood
                              result="flood"
                              floodColor="#DA2EEF"
                              floodOpacity=".8"
                            />
                            <feComposite
                              in="flood"
                              result="mask"
                              in2="SourceGraphic"
                              operator="in"
                            />
                            <feMorphology
                              in="mask"
                              result="dilated"
                              operator="dilate"
                              radius={3}
                            />
                            <feGaussianBlur
                              in="dilated"
                              result="blurred"
                              stdDeviation={8}
                            />
                            <feMerge>
                              <feMergeNode in="blurred" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <g filter="url(#k-line-glow-negative)">
                          <polyline
                            vectorEffect="non-scaling-stroke"
                            points="0,160.005761179283 7.042253521126761,195.94638912496532 14.084507042253522,213.39812900783306 21.12676056338028,256.2858565445987 28.169014084507044,236.31603086327675 35.21126760563381,221.5938285939775 42.25352112676056,232.6952567642296 49.29577464788732,252.81714563457035 56.33802816901409,245.33626639733677 63.38028169014084,224.4988428114949 70.42253521126761,205.5937271638278 77.46478873239435,171.71316373555283 84.50704225352112,162.55660751505616 91.54929577464789,194.20963182122864 98.59154929577464,215.7306245267789 105.63380281690141,204.74855308019903 112.67605633802818,263.91234034190734 119.71830985915493,301.69170066557206 126.76056338028168,314.1124164707144 133.80281690140845,280.101150638161 140.84507042253523,250.10855324965257 147.88732394366198,245.7277258108935 154.9295774647887,257.1334962242919 161.9718309859155,278.25960620938224 169.01408450704224,332.9909923547209 176.056338028169,342.20014649838913 183.09859154929578,341.4898743987791 190.14084507042253,314.56285826698866 197.18309859154928,294.14573815237725 204.22535211267606,306.0126327696812 211.26760563380282,281.31184781500656 218.30985915492957,218.49647530092273 225.35211267605635,218.94917065995958 232.3943661971831,225.56748059393738 239.43661971830986,212.72344465462515 246.47887323943664,198.34163016559853 253.52112676056336,198.9056082695398 260.5633802816901,223.9957064355376 267.6056338028169,218.58999052492902 274.6478873239437,188.88666959679483 281.69014084507046,201.61477896664155 288.7323943661972,207.25077339377503 295.77464788732397,215.49676530921238 302.8169014084507,251.0326597671891 309.8591549295774,251.75821823796082 316.90140845070425,266.00093357388846 323.943661971831,270.4288705737139 330.98591549295776,246.89737885489888 338.0281690140845,231.55630793967578 345.07042253521126,212.50645929948996 352.112676056338,215.75612010488487 359.1549295774648,176.13327691149232 366.19718309859155,169.97131688771208 373.23943661971833,71.58143869397315 380.28169014084506,78.27401255570283 387.32394366197184,82.86005198036594 394.36619718309856,92.8373142899004 401.40845070422534,120.12582119185276 408.4507042253521,130.7765072594899 415.49295774647885,153.1428305399977 422.53521126760563,162.24656338338673 429.57746478873236,155.23491090241544 436.61971830985914,158.81672140379294 443.6619718309859,159.89474538665468 450.7042253521127,205.17886178133074 457.7464788732394,252.1724929961215 464.7887323943662,305.33023639221096 471.83098591549293,303.1772118198759 478.8732394366197,300.3961963655885 485.9154929577465,285.0923421429351 492.9577464788733,283.01814806430355 500,305.1006236029423 507.0422535211267,346.23407642825066 514.0845070422534,315.23574327428526 521.1267605633802,328.49942731153806 528.169014084507,363.09135431270397 535.2112676056338,430.2807377028389 542.2535211267606,468.83564382528937 549.2957746478874,476.6991821616972 556.3380281690141,446.0092437697956 563.3802816901409,447.02612642477914 570.4225352112676,443.3438121714414 577.4647887323944,432.0522336314955 584.5070422535211,360.7532781648365 591.5492957746479,331.7218801546119 598.5915492957746,335.2952819579407 605.6338028169014,314.16601985083764 612.6760563380282,337.54597527379417 619.7183098591548,385.76149405981266 626.7605633802817,362.60265574214634 633.8028169014085,373.07490203149007 640.8450704225353,383.74918163353084 647.887323943662,422.1306592412294 654.9295774647887,456.6559074909442 661.9718309859155,454.8721050956798 669.0140845070423,451.3065646324096 676.056338028169,434.76623316377015 683.0985915492957,465.2487283021311 690.1408450704225,456.93783101920053 697.1830985915493,444.9649721859556 704.225352112676,392.9837005099705 711.2676056338029,387.6190828257785 718.3098591549297,395.90750199394563 725.3521126760563,426.13923490800664 732.3943661971831,435.29285443157266 739.4366197183099,393.2010685090296 746.4788732394367,356.4525265198979 753.5211267605633,349.04547482288945 760.5633802816901,353.56878877746385 767.6056338028169,371.80511196374164 774.6478873239437,385.0870368058804 781.6901408450703,404.81418830163864 788.7323943661971,397.71477362900987 795.774647887324,368.10746209733225 802.8169014084507,381.76341464222105 809.8591549295775,366.4249268090608 816.9014084507043,388.4677114911617 823.943661971831,387.8724696197719 830.9859154929577,406.6273830717837 838.0281690140845,516.4235002946518 845.0704225352113,518.6168901141386 852.112676056338,472.0397253613213 859.1549295774647,429.22104717654884 866.1971830985915,431.6870107702474 873.2394366197183,492.8701519677794 880.2816901408452,603.5166258630356 887.3239436619718,697.4091112258811 894.3661971830986,692.8568800065507 901.4084507042254,710.6888428542763 908.4507042253521,714.9011467504872 915.4929577464789,797.211307520267 922.5352112676056,784.6360167019133 929.5774647887324,717.3768170516287 936.6197183098591,735.3673431652996 943.6619718309859,697.4155517463854 950.7042253521126,689.9281994660016 957.7464788732394,650.3738035577173 964.7887323943662,590.8209471318625 971.830985915493,560.8277008719065 978.8732394366198,496.8126071959175 985.9154929577466,485.4982045529175 992.9577464788732,483.6534055654007 1000,484.92773023244524 1007.0422535211268,464.72440125773403 1014.0845070422534,500.7967893567839 1021.1267605633802,506.09800189260795 1028.169014084507,540.0355016543328 1035.2112676056338,570.1519674928106 1042.2535211267605,576.8926587131011 1049.2957746478874,578.8874431944521 1056.338028169014,541.3693784818482 1063.3802816901407,563.0314110716366 1070.4225352112676,579.6394661507 1077.4647887323943,602.4130928704066 1084.5070422535211,625.1433714920126 1091.549295774648,628.7096805344582 1098.5915492957747,612.116867234537 1105.6338028169014,600.9275852097953 1112.6760563380283,638.9384104710308 1119.718309859155,623.2908180466627 1126.7605633802818,577.8947728747332 1133.8028169014085,566.1187444931113 1140.8450704225352,607.8405898530766 1147.887323943662,622.2920904460667 1154.9295774647887,619.4953879331808 1161.9718309859154,658.7498186778673 1169.0140845070423,673.7064712401248 1176.056338028169,716.4788347485372 1183.0985915492959,671.740924954478 1190.1408450704225,676.7941947194524 1197.1830985915492,664.9851388749719 1204.225352112676,693.4976771488741 1211.2676056338028,715.9465866020907 1218.3098591549294,718.3676041404042 1225.3521126760563,725.9099011369212 1232.394366197183,725.3661101534069 1239.4366197183097,719.097579198613 1246.4788732394366,735.4042865206566 1253.5211267605634,759.6976582223988 1260.5633802816903,756.5365044952052 1267.605633802817,768.0654293305333 1274.6478873239437,746.4122785698528 1281.6901408450706,726.0067421855135 1288.7323943661972,664.9298625183837 1295.774647887324,620.0372243185379 1302.8169014084508,594.1706717445678 1309.8591549295775,587.8114169156704 1316.9014084507041,628.3041128231059 1323.943661971831,623.2129356283677 1330.9859154929577,619.133713128558 1338.0281690140846,675.8291891006488 1345.0704225352113,634.567590556491 1352.112676056338,605.7884260381618 1359.1549295774648,607.2755228468623 1366.1971830985915,625.9248943215915 1373.2394366197182,625.2706232439817 1380.281690140845,647.8189583467486 1387.3239436619717,631.1475575075981 1394.3661971830986,636.1197437322742 1401.4084507042253,648.0495423535053 1408.450704225352,697.5067615470257 1415.4929577464789,712.5890000371217 1422.5352112676057,697.3270091028819 1429.5774647887324,681.9473333222205 1436.6197183098593,673.5395352906078 1443.661971830986,655.150605508767 1450.7042253521126,654.9747739921545 1457.7464788732395,625.4366829039271 1464.7887323943662,609.6456029398435 1471.830985915493,604.4857151021538 1478.8732394366198,598.7050155978734 1485.9154929577464,601.7070186638862 1492.9577464788733,570.792861283906 1500,584.0020924859625 1507.0422535211267,570.7131251127926 1514.0845070422536,551.8141436602275 1521.1267605633802,551.7109497772128 1528.169014084507,538.803327781085 1535.2112676056338,528.5179555141492 1542.2535211267605,526.0843741965715 1549.2957746478874,521.9885889043678 1556.338028169014,513.6361837285001 1563.3802816901407,519.35997162476 1570.4225352112676,532.9814182509627 1577.4647887323943,535.4775676548859 1584.5070422535211,518.5830233770912 1591.549295774648,533.1630700174103 1598.5915492957747,542.4088013601198 1605.6338028169014,545.615486838671 1612.6760563380283,552.6094898339558 1619.718309859155,539.7744564051809 1626.7605633802818,515.05083632248 1633.8028169014085,512.7091883114678 1640.8450704225352,500.3094314874285 1647.887323943662,491.45673541340534 1654.9295774647887,485.13210926576676 1661.9718309859154,485.3666394635509 1669.0140845070423,493.7200619320915 1676.056338028169,499.6877406277527 1683.0985915492959,514.0857560193352 1690.1408450704225,521.0455582586502 1697.1830985915492,534.5793491515915 1704.225352112676,533.8715145600684 1711.2676056338028,518.2918214303343 1718.3098591549294,524.5385220819951 1725.3521126760563,550.0206887311275 1732.394366197183,541.0156063824834 1739.4366197183097,549.7488779749335 1746.4788732394366,556.8628335784215 1753.5211267605634,535.6795275660672 1760.5633802816903,532.4126945852568 1767.605633802817,534.5653202099631 1774.6478873239437,541.681128412119 1781.6901408450706,537.6463992977838 1788.7323943661972,556.2237365798358 1795.774647887324,568.4764092979258 1802.8169014084508,567.1921578095929 1809.8591549295775,571.3184166913034 1816.9014084507041,552.4798164519502 1823.943661971831,552.6663378605497 1830.9859154929577,550.2168774462746 1838.0281690140846,567.7641815609028 1845.0704225352113,579.1091342108259 1852.112676056338,600.002337909089 1859.1549295774648,611.1801844478148 1866.1971830985915,601.3053666563721 1873.2394366197182,607.9825828546939 1880.281690140845,613.8041150958948 1887.3239436619717,643.9890325797327 1894.3661971830986,674.440046697017 1901.4084507042253,683.3299873417798 1908.450704225352,699.8018459340276 1915.4929577464789,693.2674807170827 1922.5352112676057,705.3546561003106 1929.5774647887324,764.828835900026 1936.6197183098593,786.4519481258744 1943.661971830986,831.7737354206342 1950.7042253521126,840.4666172454781 1957.7464788732395,816.7908447957117 1964.7887323943662,811.1034771297404 1971.830985915493,864.7713579804331 1978.8732394366198,909.7948172232337 1985.9154929577464,910.3735677743466 1992.9577464788733,928.4185613060268"
                            stroke="#DA2EEF"
                            fill="none"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="opacity-100">
                  <div
                    className="transition-all duration-200 ease overflow-hidden"
                    style={{ transition: "all 200ms ease 0s" }}
                  >
                    <div className="flex mobile:grid mobile:grid-cols-3 mobile:gap-1 p-4 mobile:p-2 w-[min(456px,100%)] self-center items-center">
                      <div className="Row flex items-center mobile:justify-self-center w-16 mobile:w-8 flex-shrink-0">
                        <div className="Col flex flex-col gap-1 grow mobile:items-center">
                          <div className="CoinAvatar flex items-center    ">
                            <div
                              className="h-6 w-6  rounded-full"
                              style={{
                                background:
                                  "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                              }}
                            >
                              <img
                                className="Image h-6 w-6 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                                src="https://img.raydium.io/icon/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R.png"
                                alt="4k3Dyjzvzp8eMZWUXbBC"
                              />
                            </div>
                          </div>
                          <div className="font-medium text-sm text-[#abc4ff]">
                            RAY
                          </div>
                        </div>
                      </div>
                      <div className="Col flex flex-col items-end mobile:items-center mobile:justify-self-center mobile:ml-0 grow">
                        <div className="text-xs font-medium text-[rgba(171,196,255,0.5)]">
                          Price
                        </div>
                        <div className="text-sm font-medium text-[#abc4ff] whitespace-nowrap">
                          $1.09
                        </div>
                      </div>
                      <div className="Col flex flex-col items-start mobile:items-center mobile:justify-self-center ml-8 mobile:ml-0 w-8">
                        <div className="text-xs font-medium text-[rgba(171,196,255,0.5)]">
                          24H%
                        </div>
                        <div className="text-sm font-medium text-[#DA2EEF]">
                          -6.54%
                        </div>
                      </div>
                      <svg
                        className="ml-10 w-36 mobile:w-full h-12 mobile:col-span-full  mobile:m-0 mobile:mt-2 flex-shrink-0"
                        viewBox="0 0 2000 1000"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <filter id="k-line-glow-negative">
                            <feFlood
                              result="flood"
                              floodColor="#DA2EEF"
                              floodOpacity=".8"
                            />
                            <feComposite
                              in="flood"
                              result="mask"
                              in2="SourceGraphic"
                              operator="in"
                            />
                            <feMorphology
                              in="mask"
                              result="dilated"
                              operator="dilate"
                              radius={3}
                            />
                            <feGaussianBlur
                              in="dilated"
                              result="blurred"
                              stdDeviation={8}
                            />
                            <feMerge>
                              <feMergeNode in="blurred" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <g filter="url(#k-line-glow-negative)">
                          <polyline
                            vectorEffect="non-scaling-stroke"
                            points="0,224.82973558487902 7.042253521126761,251.28029272885 14.084507042253522,265.78520438474436 21.12676056338028,273.4987126503024 28.169014084507044,264.9885085337461 35.21126760563381,289.0011613930144 42.25352112676056,275.5412262836329 49.29577464788732,282.80512250811864 56.33802816901409,255.40818246700928 63.38028169014084,240.70385565366553 70.42253521126761,230.49269392352232 77.46478873239435,212.83345048467663 84.50704225352112,203.0360087002514 91.54929577464789,248.3999882988985 98.59154929577464,271.76946687508405 105.63380281690141,263.6177317966882 112.67605633802818,285.5771917518614 119.71830985915493,326.6339083188469 126.76056338028168,374.2539647762933 133.80281690140845,354.1486312202652 140.84507042253523,345.78316719252643 147.88732394366198,353.5342352814341 154.9295774647887,366.09623164126685 161.9718309859155,389.2214551733683 169.01408450704224,440.4556204763186 176.056338028169,449.4953143834231 183.09859154929578,450.7392749239649 190.14084507042253,436.6137317966927 197.18309859154928,329.81818245355237 204.22535211267606,325.3540692613609 211.26760563380282,320.8475134384622 218.30985915492957,227.39171125081418 225.35211267605635,246.17412175071036 232.3943661971831,243.09219566524757 239.43661971830986,219.9878577844687 246.47887323943664,180.4181845552606 253.52112676056336,166.6452606963992 260.5633802816901,189.75416791674695 267.6056338028169,163.7963738828629 274.6478873239437,141.63975045105667 281.69014084507046,148.98432444062223 288.7323943661972,159.76318741844727 295.77464788732397,162.01611357896047 302.8169014084507,204.7510050293629 309.8591549295774,251.4155611215508 316.90140845070425,293.41380472954006 323.943661971831,302.2038643624994 330.98591549295776,288.20905699851187 338.0281690140845,285.8488151200297 345.07042253521126,265.00960801570704 352.112676056338,274.50921229551614 359.1549295774648,264.7422772604368 366.19718309859155,261.9132571243415 373.23943661971833,167.557942723986 380.28169014084506,183.14603793524145 387.32394366197184,127.09264878236786 394.36619718309856,137.5403464144656 401.40845070422534,157.24072930034345 408.4507042253521,168.7137501282782 415.49295774647885,187.56328704398857 422.53521126760563,225.70420854177007 429.57746478873236,214.41430454067392 436.61971830985914,214.54699213659694 443.6619718309859,209.8550554313381 450.7042253521127,223.16753620400596 457.7464788732394,270.39382015329704 464.7887323943662,326.68291227929035 471.83098591549293,334.57903681825087 478.8732394366197,340.0717057763028 485.9154929577465,328.4757358654913 492.9577464788733,324.12830395318883 500,348.12061952437375 507.0422535211267,373.5466508509895 514.0845070422534,380.0443526532156 521.1267605633802,382.30039196196503 528.169014084507,423.936834631592 535.2112676056338,450.04222226887714 542.2535211267606,532.7254215046448 549.2957746478874,541.1294823316532 556.3380281690141,517.0188484834198 563.3802816901409,515.1552753966647 570.4225352112676,515.2202368547771 577.4647887323944,508.96109251357433 584.5070422535211,479.4025185377044 591.5492957746479,424.20351317257644 598.5915492957746,378.9046001715809 605.6338028169014,371.83548293228 612.6760563380282,382.9839501091068 619.7183098591548,358.15212508356046 626.7605633802817,330.979059157556 633.8028169014085,298.5152189662373 640.8450704225353,326.45249814793203 647.887323943662,403.60054028872366 654.9295774647887,408.1077550577247 661.9718309859155,376.5804699177305 669.0140845070423,376.18239747987457 676.056338028169,348.97096763431864 683.0985915492957,378.97757401005333 690.1408450704225,381.0058088155715 697.1830985915493,357.541222252471 704.225352112676,339.8989020373957 711.2676056338029,332.8270561869159 718.3098591549297,305.9005023698727 725.3521126760563,325.18140993407553 732.3943661971831,335.76736447723385 739.4366197183099,309.7584190184282 746.4788732394367,271.8750241774977 753.5211267605633,273.2360299076536 760.5633802816901,250.8991063699608 767.6056338028169,256.88008836786855 774.6478873239437,276.37317976184374 781.6901408450703,309.7574238245121 788.7323943661971,293.8456768540518 795.774647887324,265.07172878160884 802.8169014084507,276.966274141235 809.8591549295775,231.4020924470757 816.9014084507043,276.66713787815775 823.943661971831,276.3454204919159 830.9859154929577,300.4141755610899 838.0281690140845,366.0764260692604 845.0704225352113,396.5609359114686 852.112676056338,368.693387884589 859.1549295774647,361.53584971134444 866.1971830985915,388.5160192700731 873.2394366197183,402.4251103555721 880.2816901408452,494.995879821274 887.3239436619718,560.4025255750569 894.3661971830986,618.252944156194 901.4084507042254,637.2638679539007 908.4507042253521,654.5296511432493 915.4929577464789,747.9819582462349 922.5352112676056,745.3110550940069 929.5774647887324,691.295150411689 936.6197183098591,705.1879013742869 943.6619718309859,624.1444792767827 950.7042253521126,599.1608318228775 957.7464788732394,562.3303969776338 964.7887323943662,497.7415916343769 971.830985915493,476.44444330987073 978.8732394366198,397.607426190513 985.9154929577466,391.79141146933534 992.9577464788732,381.259322793734 1000,397.1846845088505 1007.0422535211268,383.7042271757733 1014.0845070422534,419.82237551558853 1021.1267605633802,417.74124019996657 1028.169014084507,472.8691869515525 1035.2112676056338,475.96779998017587 1042.2535211267605,490.90710834028147 1049.2957746478874,495.82082796404666 1056.338028169014,470.2787477283388 1063.3802816901407,483.8206234166381 1070.4225352112676,490.229308438949 1077.4647887323943,509.79638112224086 1084.5070422535211,528.9804477118 1091.549295774648,538.346068078356 1098.5915492957747,537.4557625694218 1105.6338028169014,538.7340421095389 1112.6760563380283,577.3446503002745 1119.718309859155,562.7910443827793 1126.7605633802818,510.768502769925 1133.8028169014085,515.9358891884312 1140.8450704225352,541.3113861940126 1147.887323943662,562.1276013218874 1154.9295774647887,567.414531890882 1161.9718309859154,622.2642620833892 1169.0140845070423,656.8301308224413 1176.056338028169,683.4599935283618 1183.0985915492959,633.2908998241694 1190.1408450704225,635.0184108761682 1197.1830985915492,614.33175963453 1204.225352112676,633.9096478872123 1211.2676056338028,636.7625946287177 1218.3098591549294,639.2145833842633 1225.3521126760563,651.829387822203 1232.394366197183,664.1977698998226 1239.4366197183097,667.4198414645764 1246.4788732394366,658.3761908583733 1253.5211267605634,698.8740015659209 1260.5633802816903,689.7309692064555 1267.605633802817,699.5236918660796 1274.6478873239437,654.140848332198 1281.6901408450706,645.2871929026422 1288.7323943661972,660.6319299242464 1295.774647887324,641.9026191482681 1302.8169014084508,631.4646768120589 1309.8591549295775,602.2624231883249 1316.9014084507041,637.7617390772612 1323.943661971831,636.8168168482719 1330.9859154929577,622.7955034628362 1338.0281690140846,672.3024646492785 1345.0704225352113,661.1950113869905 1352.112676056338,640.5205220951083 1359.1549295774648,645.5081039485895 1366.1971830985915,644.7698797563448 1373.2394366197182,631.8835637079828 1380.281690140845,636.8000360971448 1387.3239436619717,626.7847082358437 1394.3661971830986,636.1641653666259 1401.4084507042253,657.8617639426499 1408.450704225352,692.3793360385305 1415.4929577464789,730.7878904781193 1422.5352112676057,734.3749368567981 1429.5774647887324,715.1946280426114 1436.6197183098593,716.356495140538 1443.661971830986,717.7099961435279 1450.7042253521126,708.9690132998392 1457.7464788732395,690.1093166216913 1464.7887323943662,637.0741853015934 1471.830985915493,633.2552461479431 1478.8732394366198,625.9954239478902 1485.9154929577464,630.1870553820502 1492.9577464788733,605.9825408395343 1500,608.8473044456122 1507.0422535211267,576.9125017640986 1514.0845070422536,556.5738864292748 1521.1267605633802,555.7063240645414 1528.169014084507,543.9235453540964 1535.2112676056338,528.5761012490938 1542.2535211267605,542.9986863590152 1549.2957746478874,527.272772477782 1556.338028169014,532.4021117445211 1563.3802816901407,538.4607290633237 1570.4225352112676,555.1120287924737 1577.4647887323943,562.4253206804494 1584.5070422535211,561.0018788725586 1591.549295774648,566.2218070533056 1598.5915492957747,570.9136575758141 1605.6338028169014,573.7539324911668 1612.6760563380283,595.8510107680229 1619.718309859155,586.9402948325842 1626.7605633802818,548.0584284245191 1633.8028169014085,534.0590374899101 1640.8450704225352,524.1751286796174 1647.887323943662,513.7614935672159 1654.9295774647887,495.9606088529431 1661.9718309859154,493.34556022455854 1669.0140845070423,496.0855303591874 1676.056338028169,502.82971347673265 1683.0985915492959,510.9445185455531 1690.1408450704225,514.9844213879464 1697.1830985915492,518.0128708362236 1704.225352112676,511.5754603897644 1711.2676056338028,503.1386613983551 1718.3098591549294,515.9273497800943 1725.3521126760563,532.6686439353875 1732.394366197183,524.1750978190198 1739.4366197183097,528.0954728648519 1746.4788732394366,530.8875026476131 1753.5211267605634,522.3279766610447 1760.5633802816903,515.6494023637049 1767.605633802817,513.8191252526224 1774.6478873239437,507.7489325460118 1781.6901408450706,507.22883277924603 1788.7323943661972,512.3334214121007 1795.774647887324,517.575538931352 1802.8169014084508,523.2948889640409 1809.8591549295775,520.3133829637238 1816.9014084507041,504.40702659122286 1823.943661971831,496.5595625444419 1830.9859154929577,491.82342357095314 1838.0281690140846,507.20974254139344 1845.0704225352113,491.1879909739863 1852.112676056338,519.8204592712682 1859.1549295774648,521.135386243112 1866.1971830985915,528.2498240341502 1873.2394366197182,539.3820982522179 1880.281690140845,539.5964541686226 1887.3239436619717,560.3688652945405 1894.3661971830986,587.2291945510784 1901.4084507042253,604.6434696823786 1908.450704225352,631.3428177441353 1915.4929577464789,634.0642565929197 1922.5352112676057,641.6446844191314 1929.5774647887324,671.0242930742129 1936.6197183098593,693.9949080196855 1943.661971830986,747.4269489778803 1950.7042253521126,738.0965677996322 1957.7464788732395,724.4927687083327 1964.7887323943662,728.2128344715111 1971.830985915493,770.031174154254 1978.8732394366198,815.6725173325021 1985.9154929577464,823.1737876360382 1992.9577464788733,872.9073512176321"
                            stroke="#DA2EEF"
                            fill="none"
                          />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {selectButton === "Liquidity" && <Liquidity />}
      </div>
    </>
  );
};

export default Card;
