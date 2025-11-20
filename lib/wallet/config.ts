import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Determine which chain to use based on environment
const chain = process.env.NODE_ENV === "production" ? mainnet : sepolia;

// Build connectors array conditionally
const connectors = [
  injected(),
  coinbaseWallet({ appName: "blockhashpro Mining" }),
  // Only add WalletConnect connector if project ID is configured
  ...(projectId
    ? [
        walletConnect({
          projectId,
          metadata: {
            name: "blockhashpro Mining",
            description: "blockhashpro is a professional crypto mining marketplace",
            url: process.env.NEXT_PUBLIC_APP_URL || "https://blockhashpro.xyz",
            icons: [(process.env.NEXT_PUBLIC_APP_URL || "https://blockhashpro.xyz") + "/favicon.ico"],
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

