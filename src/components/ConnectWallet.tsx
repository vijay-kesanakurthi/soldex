
import { FC} from "react";

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: FC<ConnectWalletProps> = () => {
 
  return (
    <>
      <div className="j ">
        <button className="Button select-none inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl mobile:rounded-lg font-medium whitespace-nowrap appearance-none bg-formkit-thumb text-formkit-thumb-text-normal clickable clickable-filter-effect frosted-glass frosted-glass-teal">
          <div className="Row flex items-center gap-3 my-0.5">
            <div className="Icon grid h-max w-max">
              <img
                src="https://raydium.io/icons/msic-wallet.svg"
                alt="msic-wallet"
                className="select-none h-4 w-4"
              />
            </div>
            <div className="text-sm font-medium text-[#fff]">
              Connect Wallet
            </div>
          </div>
        </button>
      </div>
    </>
  );
};

export default ConnectWallet;
