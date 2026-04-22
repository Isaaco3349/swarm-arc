// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { setCookie, getCookie } from "cookies-next";
import { SocialLoginProvider } from "@circle-fin/w3s-pw-web-sdk/dist/src/types";
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

export default function HomePage() {
  const sdkRef = useRef<W3SSdk | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceIdLoading, setDeviceIdLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string>("");
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState<string>("");
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready");

  useEffect(() => {
    let cancelled = false;
    const initSdk = async () => {
      try {
        const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
        const onLoginComplete = (error: unknown, result: any) => {
          if (cancelled) return;
          if (error) {
            const err = error as any;
            setLoginError(err.message || "Login failed");
            setLoginResult(null);
            setStatus("Login failed");
            return;
          }
          setLoginResult({
            userToken: result.userToken,
            encryptionKey: result.encryptionKey,
          });
          setLoginError(null);
          setStatus("Login successful. Credentials received from Google.");
        };

        const restoredAppId = (getCookie("appId") as string) || appId || "";
        const restoredGoogleClientId = (getCookie("google.clientId") as string) || googleClientId || "";
        const restoredDeviceToken = (getCookie("deviceToken") as string) || "";
        const restoredDeviceEncryptionKey = (getCookie("deviceEncryptionKey") as string) || "";

        const sdk = new W3SSdk(
          {
            appSettings: { appId: restoredAppId },
            loginConfigs: {
              deviceToken: restoredDeviceToken,
              deviceEncryptionKey: restoredDeviceEncryptionKey,
              google: {
                clientId: restoredGoogleClientId,
                redirectUri: typeof window !== "undefined" ? window.location.origin : "",
                selectAccountPrompt: true,
              },
            },
          },
          onLoginComplete
        );
        sdkRef.current = sdk;
        if (!cancelled) {
          setSdkReady(true);
          setStatus("SDK initialized. Ready to create device token.");
        }
      } catch (err) {
        if (!cancelled) setStatus("Failed to initialize Web SDK");
      }
    };
    void initSdk();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;
      try {
        const cached = typeof window !== "undefined" ? window.localStorage.getItem("deviceId") : null;
        if (cached) { setDeviceId(cached); return; }
        setDeviceIdLoading(true);
        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);
        if (typeof window !== "undefined") window.localStorage.setItem("deviceId", id);
      } catch {
        setStatus("Failed to get deviceId");
      } finally {
        setDeviceIdLoading(false);
      }
    };
    if (sdkReady) void fetchDeviceId();
  }, [sdkReady]);

  async function loadUsdcBalance(userToken: string, walletId: string) {
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getTokenBalance", userToken, walletId }),
      });
      const data = await response.json();
      if (!response.ok) { setStatus("Failed to load USDC balance"); return null; }
      const balances = (data.tokenBalances as any[]) || [];
      const usdcEntry = balances.find((t) => {
        const symbol = t.token?.symbol || "";
        const name = t.token?.name || "";
        return symbol.startsWith("USDC") || name.includes("USDC");
      }) ?? null;
      const amount = usdcEntry?.amount ?? "0";
      setUsdcBalance(amount);
      return amount;
    } catch {
      setStatus("Failed to load USDC balance");
      return null;
    }
  }

  const loadWallets = async (userToken: string, options?: { source?: "afterCreate" | "alreadyInitialized" }) => {
    try {
      setStatus("Loading wallet details...");
      setUsdcBalance(null);
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listWallets", userToken }),
      });
      const data = await response.json();
      if (!response.ok) { setStatus("Failed to load wallet details"); return; }
      const wallets = (data.wallets as Wallet[]) || [];
      setWallets(wallets);
      if (wallets.length > 0) {
        await loadUsdcBalance(userToken, wallets[0].id);
        if (options?.source === "afterCreate") setStatus("Wallet created successfully! Wallet details and USDC balance loaded.");
        else if (options?.source === "alreadyInitialized") setStatus("User already initialized. Wallet details and USDC balance loaded.");
        else setStatus("Wallet details and USDC balance loaded.");
      } else {
        setStatus("No wallets found for this user.");
      }
    } catch {
      setStatus("Failed to load wallet details");
    }
  };

  const handleCreateDeviceToken = async () => {
    if (!deviceId) { setStatus("Missing deviceId"); return; }
    try {
      setStatus("Creating device token...");
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createDeviceToken", deviceId }),
      });
      const data = await response.json();
      if (!response.ok) { setStatus("Failed to create device token"); return; }
      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);
      setCookie("deviceToken", data.deviceToken);
      setCookie("deviceEncryptionKey", data.deviceEncryptionKey);
      setStatus("Device token created");
    } catch {
      setStatus("Failed to create device token");
    }
  };

  const handleLoginWithGoogle = () => {
    const sdk = sdkRef.current;
    if (!sdk) { setStatus("SDK not ready"); return; }
    if (!deviceToken || !deviceEncryptionKey) { setStatus("Missing deviceToken or deviceEncryptionKey"); return; }
    setCookie("appId", appId);
    setCookie("google.clientId", googleClientId);
    setCookie("deviceToken", deviceToken);
    setCookie("deviceEncryptionKey", deviceEncryptionKey);
    sdk.updateConfigs({
      appSettings: { appId },
      loginConfigs: {
        deviceToken,
        deviceEncryptionKey,
        google: {
          clientId: googleClientId,
          redirectUri: window.location.origin,
          selectAccountPrompt: true,
        },
      },
    });
    setStatus("Redirecting to Google...");
    sdk.performLogin(SocialLoginProvider.GOOGLE);
  };

  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) { setStatus("Missing userToken. Please login with Google first."); return; }
    try {
      setStatus("Initializing user...");
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initializeUser", userToken: loginResult.userToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 155106) {
          await loadWallets(loginResult.userToken, { source: "alreadyInitialized" });
          setChallengeId(null);
          return;
        }
        setStatus("Failed to initialize user: " + (data.error || data.message));
        return;
      }
      setChallengeId(data.challengeId);
      setStatus(`User initialized. challengeId: ${data.challengeId}`);
    } catch (err: any) {
      if (err?.code === 155106 && loginResult?.userToken) {
        await loadWallets(loginResult.userToken, { source: "alreadyInitialized" });
        setChallengeId(null);
        return;
      }
      setStatus("Failed to initialize user: " + (err?.message || "Unknown error"));
    }
  };

  const handleExecuteChallenge = () => {
    const sdk = sdkRef.current;
    if (!sdk) { setStatus("SDK not ready"); return; }
    if (!challengeId) { setStatus("Missing challengeId. Initialize user first."); return; }
    if (!loginResult?.userToken || !loginResult?.encryptionKey) { setStatus("Missing login credentials."); return; }
    sdk.setAuthentication({ userToken: loginResult.userToken, encryptionKey: loginResult.encryptionKey });
    setStatus("Executing challenge...");
    sdk.execute(challengeId, (error) => {
      const err = (error || {}) as any;
      if (error) { setStatus("Failed to execute challenge: " + (err?.message ?? "Unknown error")); return; }
      setStatus("Challenge executed. Loading wallet details...");
      void (async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setChallengeId(null);
        await loadWallets(loginResult.userToken, { source: "afterCreate" });
      })();
    });
  };

  const primaryWallet = wallets[0];

  return (
    <main>
      <div style={{ width: "50%", margin: "0 auto" }}>
        <h1>Swarm — Agent Wallet Setup</h1>
        <p>Follow the steps below to create your Arc testnet wallet:</p>
        <div>
          <button onClick={handleCreateDeviceToken} style={{ margin: "6px" }} disabled={!sdkReady || !deviceId || deviceIdLoading}>
            1. Create device token
          </button>
          <br />
          <button onClick={handleLoginWithGoogle} style={{ margin: "6px" }} disabled={!deviceToken || !deviceEncryptionKey}>
            2. Login with Google
          </button>
          <br />
          <button onClick={handleInitializeUser} style={{ margin: "6px" }} disabled={!loginResult || wallets.length > 0}>
            3. Initialize user (get challenge)
          </button>
          <br />
          <button onClick={handleExecuteChallenge} style={{ margin: "6px" }} disabled={!challengeId || wallets.length > 0}>
            4. Create wallet (execute challenge)
          </button>
        </div>
        <p><strong>Status:</strong> {status}</p>
        {loginError && <p style={{ color: "red" }}><strong>Error:</strong> {loginError}</p>}
        {primaryWallet && (
          <div style={{ marginTop: "12px" }}>
            <h2>Wallet details</h2>
            <p><strong>Address:</strong> {primaryWallet.address}</p>
            <p><strong>Blockchain:</strong> {primaryWallet.blockchain}</p>
            {usdcBalance !== null && <p><strong>USDC balance:</strong> {usdcBalance}</p>}
          </div>
        )}
      </div>
    </main>
  );
}