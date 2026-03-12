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
  { key: "gravityMainnet",   apiBase: "https://explorer-testnet.gravity.xyz",          explorerBase: "https://explorer-testnet.gravity.xyz" },
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
  console.log("[explorer] fetchJson url:", url);
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  console.log("[explorer] raw response:", text);
  try {
    return JSON.parse(text);
  } catch {
    return text as any;
  }
}

async function getBlockscoutStats(apiBase: string, explorerBase: string, address: string): Promise<ExplorerStats> {
  const explorerAddressUrl = `${explorerBase.replace(/\/$/, "")}/address/${address}`;
  const api = apiBase.replace(/\/$/, "");

  // Per-chain timeout to keep the endpoint fast.
  const t = withTimeout(8000);
  try {
    // Blockscout API v2 (preferred)
    const addr = await fetchJson(`${api}/api/v2/addresses/${address}`, t.signal);
    let txCount: number | null =
      typeof addr?.transactions_count === "number" ? addr.transactions_count :
      typeof addr?.transaction_count === "number" ? addr.transaction_count :
      typeof addr?.tx_count === "number" ? addr.tx_count :
      null;

    let firstTxDate: string | null = null;

    // Try v2 transactions list for first tx
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
      // ignore, we may still get data from v1
    }

    // If v2 didn't expose a tx count or first tx, consult legacy v1 txlist.
    if (txCount == null || firstTxDate == null) {
      try {
        // Ask for the full tx list (Blockscout will cap to a sane maximum, usually 10k).
        const legacy = await fetchJson(`${api}/api?module=account&action=txlist&address=${address}&sort=asc`, t.signal);
        const list: any[] = Array.isArray(legacy?.result) ? legacy.result : [];
        const first = list[0];
        const ts = first?.timeStamp;
        if (firstTxDate == null && typeof ts === "string") {
          firstTxDate = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
        }
        // If legacy returned a list, use its length as an approximate tx count.
        if (txCount == null) {
          txCount = list.length;
        }
      } catch {
        // ignore; we'll keep whatever we have
      }
    }

    return { txCount, firstTxDate, explorerAddressUrl, error: null };
  } catch (err) {
    // Complete failure for this chain: return N/A but keep a link + error message
    return { txCount: null, firstTxDate: null, explorerAddressUrl, error: err instanceof Error ? err.message : "Fetch failed" };
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

