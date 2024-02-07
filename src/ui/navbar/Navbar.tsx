import "./navbar.scss";

// import ConnectWallet from "../../components/ConnectWallet";
import {
  // WalletConnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

declare global {
  interface Window {
    ethereum?: Record<string, unknown> | undefined;
  }
}

const Navbar = () => {
  return (
    <header>
      <nav className="h-20 w-full flexBetween fixed  top-0 bg-[#131a35] backdrop-blur-md nav text-white font-bold transition-all px-8 ">
        {" "}
        <a href="#hero">
          <img src="./logo1.png" className="h-20 " alt="" />
        </a>
        <WalletMultiButton className="bg-[#131a35]" />
        {/* <WalletConnectButton /> */}
      </nav>
    </header>
  );
};

export default Navbar;
