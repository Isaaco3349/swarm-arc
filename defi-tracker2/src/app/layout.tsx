import type { Metadata } from "next";
import { WalletProvider } from "@/context/WalletContext";

export const metadata: Metadata = {
  title: "◈ DeFi/Track — Multi-Chain Portfolio",
  description: "Track your DeFi positions across Gravity, Tempo, Arc, Giwa and Robinhood Chain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#030803" }}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}