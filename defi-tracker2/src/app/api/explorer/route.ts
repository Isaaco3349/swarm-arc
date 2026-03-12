import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExplorerStats = {
  txCount: number | null;
  firstTxDate: string | null;
  explorerAddressUrl: string;
  error?: string | null;
};

const CHAINS_FOR_EXPLORER: Array<{ key: string; apiBase: string; explorerBase: string }> = [
  { key: "gravityMainnet",   apiBase: "https://explorer.gravity.xyz",                  explorerBase: "https://explorer.gravity.xyz" },
  { key: "tempoTestnet",     apiBase: "https://scout.tempo.xyz",                      explorerBase: "https://scout.tempo.xyz" },
  { key: "arcTestnet",       apiBase: "https://testnet.arcscan.app",                  explorerBase: "https://testnet.arcscan.app" },
  { key: "giwaTestnet",      apiBase: "https://sepolia-explorer.giwa.io",             explorerBase: "https://sepolia-explorer.giwa.io" },
  { key: "robinhoodTestnet", apiBase: "https://explorer.testnet.chain.robinhood.com", explorerBase: "https://explorer.testnet.chain.robinhood.com" },
];

function isEvmAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

async function fetchJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function getBlockscoutStats(apiBase: string, explorerBase: string, address: string): Promise<ExplorerStats> {
  const explorerAddressUrl = `${explorerBase.replace(/\/$/, "")}/address/${address}`;
  const api = apiBase.replace(/\/$/, "");

  // Per-chain timeout to keep the endpoint fast.
  const t = withTimeout(8000);
  try {
    // Blockscout API v2 (preferred)
    const addr = await fetchJson(`${api}/api/v2/addresses/${address}`, t.signal);
    const txCount =
      typeof addr?.transactions_count === "number" ? addr.transactions_count :
      typeof addr?.transaction_count === "number" ? addr.transaction_count :
      typeof addr?.tx_count === "number" ? addr.tx_count :
      null;

    let firstTxDate: string | null = null;
    try {
      const txs = await fetchJson(`${api}/api/v2/addresses/${address}/transactions?sort=asc&items_count=1`, t.signal);
      const item = Array.isArray(txs?.items) ? txs.items[0] : null;
      const ts = item?.timestamp ?? item?.block_timestamp ?? item?.timeStamp;
      if (typeof ts === "string") {
        const d = new Date(ts);
        firstTxDate = isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      } else if (typeof ts === "number") {
        const d = new Date(ts * 1000);
        firstTxDate = isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      }
    } catch {
      // ok
    }

    return { txCount, firstTxDate, explorerAddressUrl, error: null };
  } catch {
    // Fallback: legacy API (first tx only)
    try {
      const legacy = await fetchJson(`${api}/api?module=account&action=txlist&address=${address}&page=1&offset=1&sort=asc`, t.signal);
      const first = Array.isArray(legacy?.result) ? legacy.result[0] : null;
      const ts = first?.timeStamp;
      const firstTxDate =
        typeof ts === "string" ? new Date(Number(ts) * 1000).toISOString().slice(0, 10) : null;
      return { txCount: null, firstTxDate, explorerAddressUrl, error: null };
    } catch (err) {
      return { txCount: null, firstTxDate: null, explorerAddressUrl, error: err instanceof Error ? err.message : "Fetch failed" };
    }
  } finally {
    t.clear();
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim() ?? "";
  if (!isEvmAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    CHAINS_FOR_EXPLORER.map(async (c) => {
      const stats = await getBlockscoutStats(c.apiBase, c.explorerBase, address);
      return [c.key, stats] as const;
    })
  );

  const data: Record<string, ExplorerStats> = {};
  results.forEach((r) => {
    if (r.status === "fulfilled") {
      const [k, v] = r.value;
      data[k] = v;
    }
  });

  return NextResponse.json({ address, data });
}

