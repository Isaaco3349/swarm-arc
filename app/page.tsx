"use client";

import { useState, useEffect } from "react";

type Task = {
  id: string;
  description: string;
  assignedTo: string;
  status: string;
  payment: number;
  result?: string;
};

type MissionResult = {
  mission: string;
  tasks: Task[];
  totalSpent: number;
  transactions: string[];
};

export default function HomePage() {
  const [mission, setMission] = useState("");
  const [walletAddress, setWalletAddress] = useState("0xbe68d59ec0836266ef1f9ec7d3d988be59bebda4");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txCount, setTxCount] = useState(0);
  useEffect(() => {
  const saved = localStorage.getItem("txCount");
  if (saved) setTxCount(parseInt(saved));
  }, []);
  const runMission = async () => {
    if (!mission || !walletAddress) {
      setError("Please enter a mission and your wallet address");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission,
          orchestratorWallet: walletAddress,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      setTxCount((prev) => {
        const newCount = prev + data.transactions.length;
        localStorage.setItem("txCount", newCount.toString());
        return newCount;
      });
    } catch (err: any) {
      setError(err.message || "Mission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: "monospace", padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "4px" }}>⬡ Swarm</h1>
      <p style={{ color: "#666", marginBottom: "32px" }}>
        Autonomous agent commerce on Arc — powered by Circle Nanopayments + Gemini
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
          Your Arc Wallet Address
        </label>
        <input
          type="text"
          placeholder="0x..."
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
          Mission
        </label>
        <textarea
          placeholder="e.g. Research the latest developments in DeFi and summarise key trends"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      <button
        onClick={runMission}
        disabled={loading}
        style={{
          background: loading ? "#999" : "#0052ff",
          color: "#fff",
          padding: "12px 28px",
          fontSize: "16px",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "32px",
        }}
      >
        {loading ? "⏳ Running mission..." : "🚀 Launch Swarm Mission"}
      </button>

      <div style={{ marginBottom: "24px", padding: "16px", background: "#f0f4ff", borderRadius: "8px" }}>
        <strong>Total on-chain transactions:</strong> {txCount} / 50 required
        <div style={{ background: "#ddd", borderRadius: "4px", height: "8px", marginTop: "8px" }}>
          <div style={{ background: "#0052ff", width: `${Math.min((txCount / 50) * 100, 100)}%`, height: "8px", borderRadius: "4px", transition: "width 0.5s" }} />
        </div>
      </div>

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", padding: "16px", borderRadius: "8px", marginBottom: "24px", color: "red" }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div>
          <h2 style={{ marginBottom: "16px" }}>✅ Mission Complete</h2>
          <p><strong>Mission:</strong> {result.mission}</p>
          <p><strong>Total spent:</strong> ${result.totalSpent.toFixed(4)} USDC</p>
          <p><strong>Transactions:</strong> {result.transactions.length}</p>

          <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>Agent Tasks</h3>
          {result.tasks.map((task, i) => (
            <div key={i} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong>🤖 {task.assignedTo}</strong>
                <span style={{ background: "#e6ffe6", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" }}>
                  ✅ {task.status}
                </span>
              </div>
              <p style={{ color: "#555", fontSize: "13px", marginBottom: "8px" }}><strong>Task:</strong> {task.description}</p>
              <p style={{ fontSize: "13px", marginBottom: "8px" }}><strong>Result:</strong> {task.result}</p>
              <p style={{ fontSize: "12px", color: "#888" }}>💰 Paid: ${task.payment} USDC</p>
            </div>
          ))}

          <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>Transaction Hashes</h3>
          {result.transactions.map((tx, i) => (
            <div key={i} style={{ fontSize: "12px", color: "#444", background: "#f0f0f0", padding: "8px", borderRadius: "4px", marginBottom: "6px", wordBreak: "break-all" }}>
              {i + 1}. {tx}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}