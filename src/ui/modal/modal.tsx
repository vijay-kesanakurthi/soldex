import { FC, useEffect, useState } from "react";
import "./modal.scss";
interface Model {
  closeHandler: () => void;
  onSetData: (data: string) => void;
  ModelData: Array<string>;
}
const Modal: FC<Model> = ({ closeHandler, onSetData, ModelData }) => {
  const [data, setData] = useState(ModelData.length > 0 ? ModelData[0] : "");
  onSetData(data);
  useEffect(() => {
    onSetData(data);
  }, [data]);
  const handleClick = async (e: string) => {
    await setData(e);
    closeHandler();
  };
  return (
    <div className="h-lvh fixed left-0 top-0 bottom-0 z-50 flexCenter w-full">
      <div className="flex flex-col  rounded-3xl mobile:rounded-none w-[min(468px,100vw)] mobile:w-full lg:h-[min(480px,100vh)] border-1.5 border-[rgba(99,130,202,0.2)] bg-cyberpunk-card-bg shadow-cyberpunk-card">
        <div className="px-8 mobile:px-6 pt-6 pb-5">
          <div className="Row flex justify-between items-center mb-6">
            <div className="text-xl font-semibold text-white">
              Select a token
            </div>
            <div
              className="Icon grid h-max w-max text-[#ABC4FF] cursor-pointer clickable clickable-mask-offset-2"
              onClick={closeHandler}
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <div className="Row flex Input cursor-text items-center py-3 px-4 rounded-xl bg-[#141041]">
            <div className="flex flex-grow flex-shrink">
              <input
                autoComplete="off"
                className="w-full overflow-hidden text-ellipsis bg-transparent border-none outline-none block placeholder-[rgba(196,214,255,0.5)] text-sm text-[#ABC4FF]"
                placeholder="Search name or mint address"
                aria-label="input for searching coins"
                defaultValue=""
                tabIndex={0}
              />
            </div>
            <div className="flex-initial ml-2">
              <div className="Icon grid h-max w-max text-[#C4D6FF]">
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
            </div>
          </div>
          <div className="text-xs font-medium text-[rgba(171,196,255,.5)] my-3">
            Popular tokens
          </div>
          <div className="Row flex justify-between">
            <div className="Row flex gap-1 py-1 px-2 mobile:py-1.5 mobile:px-2.5 rounded ring-1 ring-inset ring-[rgba(171,196,255,.3)] items-center flex-wrap clickable clickable-filter-effect">
              <div className="CoinAvatar flex items-center    ">
                <div
                  className="h-5 w-5 relative rounded-full"
                  style={{
                    background:
                      "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                  }}
                >
                  <img
                    className="Image h-5 w-5 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                    src="https://img.raydium.io/icon/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R.png"
                    alt="4k3Dyjzvzp8eMZWUXbBC"
                  />
                </div>
              </div>
              <div className="text-base mobile:text-sm font-normal text-[#ABC4FF]">
                RAY
              </div>
            </div>
            <div className="Row flex gap-1 py-1 px-2 mobile:py-1.5 mobile:px-2.5 rounded ring-1 ring-inset ring-[rgba(171,196,255,.3)] items-center flex-wrap clickable clickable-filter-effect">
              <div className="CoinAvatar flex items-center    ">
                <div
                  className="h-5 w-5 relative rounded-full"
                  style={{
                    background:
                      "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                  }}
                >
                  <img
                    className="Image h-5 w-5 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                    src="https://img.raydium.io/icon/So11111111111111111111111111111111111111112.png"
                    alt="So111111111111111111"
                  />
                </div>
              </div>
              <div className="text-base mobile:text-sm font-normal text-[#ABC4FF]">
                SOL
              </div>
            </div>
            <div className="Row flex gap-1 py-1 px-2 mobile:py-1.5 mobile:px-2.5 rounded ring-1 ring-inset ring-[rgba(171,196,255,.3)] items-center flex-wrap clickable clickable-filter-effect">
              <div className="CoinAvatar flex items-center    ">
                <div
                  className="h-5 w-5 relative rounded-full"
                  style={{
                    background:
                      "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                  }}
                >
                  <img
                    className="Image h-5 w-5 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                    src="https://img.raydium.io/icon/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB.png"
                    alt="Es9vMFrzaCERmJfrF4H2"
                  />
                </div>
              </div>
              <div className="text-base mobile:text-sm font-normal text-[#ABC4FF]">
                USDT
              </div>
            </div>
            <div className="Row flex gap-1 py-1 px-2 mobile:py-1.5 mobile:px-2.5 rounded ring-1 ring-inset ring-[rgba(171,196,255,.3)] items-center flex-wrap clickable clickable-filter-effect">
              <div className="CoinAvatar flex items-center    ">
                <div
                  className="h-5 w-5 relative rounded-full"
                  style={{
                    background:
                      "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                  }}
                >
                  <img
                    className="Image h-5 w-5 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                    src="https://img.raydium.io/icon/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png"
                    alt="EPjFWdd5AufqSSqeM2qN"
                  />
                </div>
              </div>
              <div className="text-base mobile:text-sm font-normal text-[#ABC4FF]">
                USDC
              </div>
            </div>
          </div>
        </div>
        <div className="mobile:mx-6 border-t-1.5 border-[rgba(171,196,255,0.2)]" />
        <div className="Col flex flex-col flex-1 overflow-hidden border-b-1.5 py-3 border-[rgba(171,196,255,0.2)]">
          <div className="Row flex px-8 mobile:px-6 justify-between">
            <div className="text-xs font-medium text-[rgba(171,196,255,.5)]">
              Token
            </div>
            <div className="Row flex text-xs font-medium text-[rgba(171,196,255,.5)] items-center gap-1">
              Balance / Address
            </div>
          </div>
          <div
            className="Col List flex-grow flex flex-col px-4 mobile:px-2 mx-2 gap-2 overflow-auto my-2"
            style={{ contentVisibility: "auto" }}
          >
            {ModelData?.map((item, i) => (
              <div key={i}>
                <div
                  className="Row flex clickable no-clicable-transform-effect clickable-mask-offset-2 before:bg-[rgba(0,0,0,0.2)]"
                  onClick={() => handleClick(item)}
                >
                  <div className="group w-full">
                    <div className="Row flex group w-full gap-4 justify-between items-center p-2">
                      <div className="Row flex">
                        <div className="CoinAvatar flex items-center    ">
                          <div
                            className="h-8 w-8 relative rounded-full mr-2"
                            style={{
                              background:
                                "linear-gradient(126.6deg, rgba(171, 196, 255, 0.2) 28.69%, rgba(171, 196, 255, 0) 100%)",
                            }}
                          >
                            <img
                              className="Image h-8 w-8 rounded-full overflow-hidden transition-transform transform scale-[.7]"
                              src="https://img.raydium.io/icon/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R.png"
                              alt="4k3Dyjzvzp8eMZWUXbBC"
                            />
                          </div>
                        </div>
                        <div className="Col flex flex-col mr-2">
                          <div className="Row flex">
                            <div className="Row flex items-center gap-1">
                              <div className="text-base  max-w-[7em] overflow-hidden text-ellipsis  font-normal text-[#ABC4FF]">
                                {item}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs  max-w-[12em] overflow-hidden text-ellipsis whitespace-nowrap  font-medium text-[rgba(171,196,255,.5)]">
                            Raydium
                          </div>
                        </div>
                      </div>
                      <div className="Col flex flex-col self-stretch items-end">
                        <div className="Row flex items-center text-sm whitespace-nowrap grow">
                          <div className="grow flex leading-[normal] text-2xs self-center px-1.5 py-0.5 border border-[#abc4ff] rounded-sm text-[#abc4ff] justify-center">
                            <div
                              title="4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
                              className="relative"
                            >
                              <div className="opacity-100 transition">
                                4k3Dy...rkX6R
                              </div>
                              <div className="absolute inset-0 opacity-0 pointer-events-none transition flex items-center justify-center">
                                Copied
                              </div>
                            </div>
                          </div>
                          <div className="Row flex ml-1.5 gap-0.5">
                            <a
                              tabIndex={0}
                              rel="nofollow noopener noreferrer"
                              target="_blank"
                              className="Link clickable text-[#39D0D8] hover:underline underline-offset-1"
                              href="https://solscan.io/token/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
                            >
                              <div className="Icon grid h-max w-max clickable text-[#abc4ff]">
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
                                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                  />
                                </svg>
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* <button className="Button select-none inline-flex justify-center items-center gap-2 px-4 mobile:rounded-lg whitespace-nowrap appearance-none clickable w-full py-4 rounded-none font-bold text-xs text-[#ABC4FF]">
          View Token List
        </button> */}
      </div>
    </div>
  );
};
export default Modal;
