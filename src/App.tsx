// import { ContextProvider } from "./contexts/ContextProvider";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import Hero from "./ui/hero/Hero";

import Navbar from "./ui/navbar/Navbar";
import { useMemo } from "react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

const App = () => {
  const endpoint =
    "https://mainnet.helius-rpc.com/?api-key=3f33bb5c-708a-4f5f-b9b3-8794bbdd58f2";

  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <>
            <Navbar />
            <Hero />
          </>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
