import React, { useEffect } from "react";
import { CoinModel } from "./coins";
import { useWallet } from "@solana/wallet-adapter-react";
import { SetupWhirlpool } from "../../../util/whirlpool_setup";

interface Props {
  handlefirstInput: () => void;
  fromAsset: CoinModel;
  toAsset: CoinModel;
  open1stCoin: boolean;
  handleSecondInput: () => void;
  open2ndCoin: boolean;
}
import { WhirlpoolContext, WhirlpoolClient } from "@orca-so/whirlpools-sdk";
import { getSwapQuote, getWhirlpoolPubkey } from "../../../util/swap";
import { PublicKey } from "@solana/web3.js";

const Liquidity: React.FC<Props> = ({
  handlefirstInput,
  fromAsset,
  toAsset,
  open1stCoin,
  handleSecondInput,
  open2ndCoin,
}) => {
  return (
    <>
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
            required
            className="outline-none h-full font-medium text-base text-white p-0 bg-transparent w-full rounded-br-xl rounded-tr-xl"
          />
        </div>
        <div className="text-white my-1 mx-2 w-full"></div>
        <div className="relative h-8 my-4">
          <div className="Row flex absolute h-full items-center transition-all left-4">
            <div className="Icon grid h-max w-max p-1 text-[#39D0D8]">
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
            <div className="opacity-100">
              <div
                className="transition-all duration-200 ease overflow-hidden"
                style={{ transition: "all 200ms ease 0s" }}
              >
                <div className="Row flex font-medium text-sm text-[#ABC4FF] w-max">
                  1 RAY ≈ 0.013059 SOL
                  <div className="ml-2 clickable">⇋</div>
                </div>
              </div>
            </div>
          </div>
          <div className="Row flex absolute right-0 items-center">
            <div className="Icon grid h-max w-max p-2 frosted-glass frosted-glass-teal rounded-full mr-4 clickable text-[#39D0D8] select-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="select-none h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <div className="clickable">
              <div>
                <div className="PopoverButton ">
                  <div className="w-full h-full rounded clickable clickable-filter-effect">
                    <svg width={36} height={36} viewBox="0 0 36 36">
                      <circle
                        r={9}
                        cx="50%"
                        cy="50%"
                        fill="transparent"
                        style={{ strokeWidth: 3, stroke: "#ffffff2e" }}
                      />
                      <circle
                        id="bar"
                        r={9}
                        cx="50%"
                        cy="50%"
                        fill="transparent"
                        strokeDasharray="56.548667764616276"
                        strokeDashoffset="8.482300164692383"
                        style={{
                          strokeWidth: 3,
                          stroke: "#92e1ffd9",
                          transform: "rotate(-90deg)",
                          transformOrigin: "center",
                          strokeLinecap: "round",
                          transition: "200ms",
                        }}
                      />
                    </svg>
                  </div>
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
            className="outline-none h-full font-medium text-base text-white p-0 bg-transparent w-full rounded-br-xl rounded-tr-xl"
            disabled
          />
          {/* {open2ndCoin && <Modal />} */}
          <div></div>
        </div>
        <div className="inputBox flexCenter">
          <button type="button" id="exchangeBtn" className="border-2 p-auto">
            Enter an amount
          </button>
        </div>
      </form>
      <div className="mt-12 max-w-[456px] self-center">
        <div className="mb-6 text-xl font-medium text-white">
          Your Liquidity
        </div>
        <div className="Card rounded-3xl p-6 mt-6 mobile:py-5 mobile:px-3 bg-cyberpunk-card-bg">
          <div className="Col List overflow-y-scroll flex flex-col gap-6 mobile:gap-5" />
          <div className="text-xs mobile:text-2xs font-medium text-[rgba(171,196,255,0.5)]">
            If you staked your LP tokens in a farm, unstake them to see them
            here
          </div>
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
