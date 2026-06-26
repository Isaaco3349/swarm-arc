"use client";

import { useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  description: string;
  assignedTo: string;
  status: string;
  payment: number;
  result?: string;
  txId?: string;
  simulated?: boolean;
};

type MissionResult = {
  mission: string;
  tasks: Task[];
  totalSpent: number;
  transactions: string[];
};

export default function DashboardPage() {
  const [mission, setMission] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMission = async () => {
    if (!mission || !walletAddress) {
      setError("Please enter a mission and your Arc wallet address.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, orchestratorWallet: walletAddress }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#E7F2E1",
      color: "#13291C",
      fontFamily: "-apple-system, 'Inter', 'Segoe UI', sans-serif",
      minHeight: "100vh",
    }}>
      <style>{`
        :root {
          --bg: #E7F2E1;
          --bg-panel: #D6E8CD;
          --accent: #2F7A4F;
          --cream: #13291C;
          --muted: #5C7568;
          --mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
        }
        .sw-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 28px 56px;
          border-bottom: 1px solid rgba(19,41,28,0.12);
        }
        .sw-logo {
          font-family: var(--mono); font-weight: 700; font-size: 15px;
          letter-spacing: 1px; display: flex; align-items: center; gap: 8px;
        }
        .sw-logo-mark {
          width: 18px; height: 18px; border: 1.5px solid #13291C;
          border-radius: 4px; position: relative;
        }
        .sw-logo-mark::after {
          content: ''; position: absolute; top: 4px; left: 4px;
          width: 6px; height: 6px; background: var(--accent); border-radius: 1px;
        }
        .sw-nav-links {
          display: flex; gap: 36px; font-family: var(--mono);
          font-size: 13px; letter-spacing: 0.5px; color: var(--muted);
        }
        .sw-nav-links a { color: inherit; text-decoration: none; }
        .sw-nav-links a.active { color: #13291C; border-bottom: 1px solid var(--accent); padding-bottom: 4px; }
        .dash-wrap { max-width: 720px; margin: 0 auto; padding: 72px 24px 80px; }
        .dash-title { font-size: 38px; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 8px; }
        .dash-sub { font-family: var(--mono); font-size: 13px; color: var(--muted); margin-bottom: 48px; }
        .dash-label { font-family: var(--mono); font-size: 12px; letter-spacing: 1px; color: var(--muted); margin-bottom: 8px; display: block; }
        .dash-input {
          width: 100%; padding: 14px 16px; font-size: 14px; font-family: var(--mono);
          background: #D6E8CD; border: 1px solid rgba(19,41,28,0.18);
          border-radius: 6px; color: #13291C; outline: none; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .dash-input:focus { border-color: var(--accent); }
        .dash-input::placeholder { color: var(--muted); }
        .dash-field { margin-bottom: 24px; }
        .dash-btn {
          background: #13291C; color: #E7F2E1; font-family: var(--mono);
          font-size: 14px; font-weight: 600; padding: 16px 32px;
          border-radius: 6px; border: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 10px;
          margin-top: 8px; transition: opacity 0.15s;
        }
        .dash-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .dash-btn:hover:not(:disabled) { opacity: 0.85; }
        .dash-error {
          background: rgba(180,40,40,0.08); border: 1px solid rgba(180,40,40,0.25);
          border-radius: 6px; padding: 14px 16px; font-family: var(--mono);
          font-size: 13px; color: #8b1a1a; margin-top: 28px;
        }
        .dash-results { margin-top: 48px; }
        .dash-results-title { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
        .dash-results-meta { font-family: var(--mono); font-size: 12px; color: var(--muted); margin-bottom: 32px; }
        .dash-task {
          background: #D6E8CD; border: 1px solid rgba(19,41,28,0.12);
          border-radius: 8px; padding: 20px; margin-bottom: 14px;
        }
        .dash-task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .dash-task-agent { font-family: var(--mono); font-size: 13px; font-weight: 700; color: var(--accent); }
        .dash-task-badge {
          font-family: var(--mono); font-size: 11px; padding: 3px 10px;
          border-radius: 12px; letter-spacing: 0.5px;
        }
        .badge-onchain { background: rgba(47,122,79,0.15); color: var(--accent); }
        .badge-simulated { background: rgba(180,140,0,0.12); color: #7a6000; }
        .dash-task-desc { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
        .dash-task-result { font-size: 14px; color: #13291C; line-height: 1.6; margin-bottom: 12px; }
        .dash-task-footer { display: flex; justify-content: space-between; align-items: center; }
        .dash-task-pay { font-family: var(--mono); font-size: 12px; color: var(--accent); }
        .dash-tx-section { margin-top: 32px; }
        .dash-tx-title { font-family: var(--mono); font-size: 11px; letter-spacing: 1px; color: var(--muted); margin-bottom: 12px; }
        .dash-tx {
          font-family: var(--mono); font-size: 11px; color: #13291C;
          background: rgba(19,41,28,0.06); padding: 10px 14px;
          border-radius: 4px; margin-bottom: 6px; word-break: break-all;
        }
        .dash-spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(231,242,225,0.3);
          border-top-color: #E7F2E1;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .sw-nav { padding: 20px 24px; }
          .sw-nav-links { display: none; }
          .dash-wrap { padding: 48px 20px; }
          .dash-title { font-size: 28px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="sw-nav">
        <div className="sw-logo">
          <div className="sw-logo-mark"></div>
          SWARM
        </div>
        <div className="sw-nav-links">
          <Link href="/">Home</Link>
          <a className="active">Agents</a>
          <a className="active">Bonding</a>
          <a href="#">Docs ↗</a>
        </div>
      </nav>

      {/* Main */}
      <div className="dash-wrap">
        <h1 className="dash-title">Launch a mission.</h1>
        <p className="dash-sub">
          Agents post tasks → bonded providers complete them → USDC settles on Arc.
        </p>

        <div className="dash-field">
          <label className="dash-label">ARC WALLET ADDRESS</label>
          <input
            className="dash-input"
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>

        <div className="dash-field">
          <label className="dash-label">MISSION</label>
          <textarea
            className="dash-input"
            placeholder="e.g. Research the latest developments in DeFi and summarise key trends"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={4}
            style={{ resize: "vertical" }}
          />
        </div>

        <button className="dash-btn" onClick={runMission} disabled={loading}>
          {loading ? (
            <><span className="dash-spinner"></span> Running mission...</>
          ) : (
            <>⚡ Launch Swarm Mission</>
          )}
        </button>

        {error && <div className="dash-error">✗ {error}</div>}

        {result && (
          <div className="dash-results">
            <div className="dash-results-title">Mission complete.</div>
            <div className="dash-results-meta">
              {result.tasks.length} tasks · ${result.totalSpent.toFixed(4)} USDC settled · {result.transactions.length} transactions
            </div>

            {result.tasks.map((task, i) => (
              <div key={i} className="dash-task">
                <div className="dash-task-header">
                  <span className="dash-task-agent">{task.assignedTo}</span>
                  <span className={`dash-task-badge ${task.simulated ? "badge-simulated" : "badge-onchain"}`}>
                    {task.simulated ? "simulated" : "on-chain"}
                  </span>
                </div>
                <div className="dash-task-desc">{task.description}</div>
                <div className="dash-task-result">{task.result}</div>
                <div className="dash-task-footer">
                  <span className="dash-task-pay">${task.payment} USDC</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}

            {result.transactions.length > 0 && (
              <div className="dash-tx-section">
                <div className="dash-tx-title">TRANSACTION IDS</div>
                {result.transactions.map((tx, i) => (
                  <div key={i} className="dash-tx">{i + 1}. {tx}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
