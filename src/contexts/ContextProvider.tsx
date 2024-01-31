// import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { PhantomWalletAdapter as PhantomWallet } from "@solana/wallet-adapter-wallets";
// import { FC, ReactNode, useCallback, useMemo } from "react";
// import { AutoConnectProvider, useAutoConnect } from "./AutoConnectProvider";

// import {
//   NetworkConfigurationProvider,
//   useNetworkConfiguration,
// } from "./NetworkConfigurationProvider";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
//   const { autoConnect } = useAutoConnect();
//   const { networkConfiguration } = useNetworkConfiguration();
//   const network = networkConfiguration as WalletAdapterNetwork;
//   const endpoint =
//     "https://mainnet.helius-rpc.com/?api-key=3f33bb5c-708a-4f5f-b9b3-8794bbdd58f2";

//   console.log(network);

//   const wallets = useMemo(() => [new PhantomWallet()], [network]);

//   const onError = useCallback((error: WalletError) => {
//     console.error(error);
//   }, []);

//   return (
//     // TODO: updates needed for updating and referencing endpoint: wallet adapter rework
//     <ConnectionProvider endpoint={endpoint}>
//       <WalletProvider
//         wallets={wallets}
//         onError={onError}
//         autoConnect={autoConnect}
//       >
//         <WalletModalProvider>{children}</WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   );
// };

// export const ContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
//   return (
//     <>
//       <NetworkConfigurationProvider>
//         <AutoConnectProvider>
//           <WalletContextProvider>{children}</WalletContextProvider>
//         </AutoConnectProvider>
//       </NetworkConfigurationProvider>
//     </>
//   );
// };
