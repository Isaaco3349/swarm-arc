"use client";

import { useState, useEffect, useCallback } from "react";
import { useWalletContext } from "@/context/WalletContext";

const CHAINS = {
  gravityMainnet:   { id: 1625,    name: "Gravity Alpha",     shortName: "G-L2",  color: "#00ff88", rpc: "https://rpc.gravity.xyz",                   explorer: "https://explorer.gravity.xyz",         bridge: "https://bridge.gravity.xyz",              nativeCurrency: { symbol: "G",    decimals: 18 }, type: "mainnet", stack: "Arbitrum Nitro", logo: "⚡",  note: "L2 · Arbitrum Nitro stack" },
  gravityLongevity: { id: 7771625, name: "Gravity Longevity", shortName: "G-L1",  color: "#00ffcc", rpc: "https://rpc-testnet.gravity.xyz",            explorer: "https://explorer-testnet.gravity.xyz", faucet: "https://faucet.gravity.xyz",              nativeCurrency: { symbol: "G",    decimals: 18 }, type: "testnet", stack: "Gravity L1",    logo: "🔬", note: "L1 Longevity Testnet · ~200ms blocks · no planned resets", tps: "9,500–11,000 TPS" },
  gravitySepolia:   { id: 13505,   name: "Gravity Sepolia",   shortName: "G-SEP", color: "#00cc88", rpc: "https://rpc-sepolia.gravity.xyz",            explorer: "https://explorer-sepolia.gravity.xyz", bridge: "https://bridge-sepolia.gravity.xyz",      nativeCurrency: { symbol: "G",    decimals: 18 }, type: "testnet", stack: "Arbitrum Nitro", logo: "🧪", note: "L2 Sepolia Testnet · Celestia DA" },
  tempoTestnet:     { id: 42431,   name: "Tempo Moderato",    shortName: "TEMPO", color: "#ff6b35", rpc: "https://rpc.moderato.tempo.xyz",             explorer: "https://explore.tempo.xyz",            faucet: "https://docs.tempo.xyz/quickstart/faucet", nativeCurrency: { symbol: "USD",  decimals: 18 }, type: "testnet", stack: "Tempo L1",      logo: "💳", note: "Payments L1 · no native gas · fees in TIP-20 stablecoins" },
  arcTestnet:       { id: 5042002, name: "Arc Testnet",       shortName: "ARC",   color: "#f59e0b", rpc: "https://rpc.testnet.arc.network",            explorer: "https://testnet.arcscan.app",          faucet: "https://faucet.circle.com",               nativeCurrency: { symbol: "USDC", decimals: 18 }, type: "testnet", stack: "Arc L1",        logo: "🏛️", note: "Circle-backed L1 · USDC as native gas · deterministic finality" },
  giwaTestnet:      { id: 91342,   name: "GIWA Sepolia",      shortName: "GIWA",  color: "#ec4899", rpc: "https://sepolia-rpc.giwa.io",                explorer: "https://sepolia-explorer.giwa.io",     faucet: "https://faucet.giwa.io",                  nativeCurrency: { symbol: "ETH",  decimals: 18 }, type: "testnet", stack: "OP Stack L2",   logo: "🏯", note: "Upbit-backed OP Stack L2 · 1s blocks · mainnet TBD" },
  robinhoodTestnet: { id: 46630,   name: "Robinhood Testnet", shortName: "RH",    color: "#00c805", rpc: "https://rpc.testnet.chain.robinhood.com",    explorer: "https://explorer.testnet.chain.robinhood.com", nativeCurrency: { symbol: "ETH",  decimals: 18 }, type: "testnet", stack: "Arbitrum L2",   logo: "🪶", note: "Robinhood Chain · Arbitrum L2 · ETH gas" },
  arbitrum:         { id: 42161,   name: "Arbitrum One",      shortName: "ARB",   color: "#28a0f0", rpc: "https://arb1.arbitrum.io/rpc",               explorer: "https://arbiscan.io",                                                                    nativeCurrency: { symbol: "ETH",  decimals: 18 }, type: "mainnet", stack: "Arbitrum",      logo: "🔷", note: "Arbitrum One mainnet" },
};

const PROTOCOLS = {
  longevity: { name: "Longevity", tag: "GRAVITY",  color: "#00ffcc", chains: ["gravityLongevity","gravityMainnet"], type: "Gravity L1 Testnet",                   status: "testnet", docsUrl: "https://docs.gravity.xyz/network/l1-longevity-testnet", faucet: "https://faucet.gravity.xyz" },
  tempo:     { name: "Tempo",     tag: "TEMPO",    color: "#ff6b35", chains: ["tempoTestnet"],                      type: "Payments L1 · TIP-20 stablecoins",     status: "testnet", docsUrl: "https://docs.tempo.xyz",   faucet: "https://docs.tempo.xyz/quickstart/faucet" },
  arc:       { name: "Arc",       tag: "ARC",      color: "#f59e0b", chains: ["arcTestnet"],                        type: "Circle L1 · USDC gas",                 status: "testnet", docsUrl: "https://docs.arc.network", faucet: "https://faucet.circle.com" },
  giwa:      { name: "Giwa",      tag: "GIWA",     color: "#ec4899", chains: ["giwaTestnet"],                       type: "Upbit OP Stack L2 · 1s blocks",        status: "testnet", docsUrl: "https://docs.giwa.io",     faucet: "https://faucet.giwa.io" },
  robinhood: { name: "Robinhood", tag: "RH",       color: "#00c805", chains: ["robinhoodTestnet"],                  type: "Arbitrum L2 · ETH gas",                status: "testnet", docsUrl: "https://docs.robinhood.com/chain/deploy-smart-contracts/", faucet: null },
};

const generateMockPositions = () => [
  { id: "longevity-g-l1",   protocol: "longevity", chain: "gravityLongevity", type: "Staking", asset: "G",        deposited: 12500, earned: 234.56, apy: 18.4, healthFactor: null, status: "testnet" },
  { id: "longevity-g-l2",   protocol: "longevity", chain: "gravityMainnet",   type: "Staking", asset: "G",        deposited:  5000, earned:  87.20, apy: 16.1, healthFactor: null, status: "active"  },
  { id: "tempo-supply",     protocol: "tempo",     chain: "tempoTestnet",     type: "Supply",  asset: "pathUSD",  deposited:  5000, earned:  47.23, apy:  8.2, healthFactor: null, status: "testnet" },
  { id: "tempo-borrow",     protocol: "tempo",     chain: "tempoTestnet",     type: "Borrow",  asset: "AlphaUSD", deposited: -2000, earned: -12.40, apy:  3.1, healthFactor: 2.34, status: "testnet" },
  { id: "arc-lp",           protocol: "arc",       chain: "arcTestnet",       type: "LP",      asset: "USDC",     deposited:  3200, earned:  89.10, apy: 24.6, healthFactor: null, status: "testnet" },
  { id: "giwa-vault",       protocol: "giwa",      chain: "giwaTestnet",      type: "Vault",   asset: "ETH",      deposited:   2.4, earned:   0.12, apy: 11.8, healthFactor: null, status: "testnet" },
  { id: "robinhood-supply", protocol: "robinhood", chain: "robinhoodTestnet", type: "Supply",  asset: "ETH",      deposited:   1.5, earned:   0.04, apy:  5.2, healthFactor: null, status: "testnet" },
];

const TICKER_PRICES: Record<string, number> = { G: 0.42, ETH: 3240, USDC: 1, USD: 1, pathUSD: 1, AlphaUSD: 1, WETH: 3240, ARB: 0.89 };
const fmt     = (n: number | null, d = 2) => n == null ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD  = (n: number | null) => n == null ? "—" : USD.format(n);
const shortAddr = (a: string) => `${a.slice(0,6)}...${a.slice(-4)}`;
const priceOf   = (sym: string) => TICKER_PRICES[sym] ?? 1;

function TickerBar() {
  const [offset, setOffset] = useState(0);
  const items = [{sym:"G",price:0.42,change:5.2},{sym:"ETH",price:3240,change:-1.1},{sym:"USDC",price:1,change:0.01},{sym:"ARB",price:0.89,change:2.8},{sym:"WETH",price:3240,change:-1.1}];
  const rep = [...items,...items,...items,...items];
  useEffect(()=>{ const id=setInterval(()=>setOffset(o=>o-1),30); return()=>clearInterval(id); },[]);
  return (
    <div style={{overflow:"hidden",borderBottom:"1px solid #1a2a1a",background:"#050d05",height:28,display:"flex",alignItems:"center"}}>
      <div style={{display:"flex",gap:40,transform:`translateX(${offset%600}px)`,whiteSpace:"nowrap",transition:"none"}}>
        {rep.map((item,i)=>(
          <span key={i} style={{fontFamily:"'Courier New',monospace",fontSize:11,color:"#5a7a5a"}}>
            <span style={{color:"#00cc66",marginRight:6}}>{item.sym}</span>
            <span style={{color:"#ccc"}}>{fmtUSD(item.price)}</span>
            <span style={{color:item.change>=0?"#00ff88":"#ff4455",marginLeft:4}}>{item.change>=0?"▲":"▼"}{Math.abs(item.change)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ChainBadge({ chainKey, small=false }: { chainKey: string; small?: boolean }) {
  const c = CHAINS[chainKey as keyof typeof CHAINS]; if (!c) return null;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:small?"1px 6px":"2px 8px",borderRadius:3,border:`1px solid ${c.color}33`,background:`${c.color}11`,color:c.color,fontSize:small?9:10,fontFamily:"'Courier New',monospace",letterSpacing:1,fontWeight:700}}>
      {c.logo} {c.shortName}{c.type==="testnet"&&<span style={{color:"#666",fontSize:7}}>TEST</span>}
    </span>
  );
}

function ProtocolBadge({ protocolKey }: { protocolKey: string }) {
  const p = PROTOCOLS[protocolKey as keyof typeof PROTOCOLS]; if (!p) return null;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:2,background:`${p.color}22`,color:p.color,fontSize:10,fontFamily:"'Courier New',monospace",letterSpacing:2,fontWeight:700,border:`1px solid ${p.color}44`}}>{p.tag}</span>;
}

function StatCard({ label, value, sub, accent="#00ff88", blink=false }: { label: string; value: string; sub?: string; accent?: string; blink?: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(()=>{ if(!blink)return; const id=setInterval(()=>setOn(b=>!b),800); return()=>clearInterval(id); },[blink]);
  return (
    <div style={{background:"#080f08",border:"1px solid #1a2a1a",padding:"16px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:accent,boxShadow:`0 0 8px ${accent}66`}}/>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#446644",letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:22,fontWeight:700,color:blink?(on?accent:"#446644"):accent,letterSpacing:1,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontFamily:"'Courier New',monospace",fontSize:10,color:"#446644",marginTop:4}}>{sub}</div>}
    </div>
  );
}

function PositionRow({ pos, isLast }: { pos: any; isLast: boolean }) {
  const isBorrow = pos.type==="Borrow";
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 100px 110px 100px 80px 80px 90px",alignItems:"center",padding:"10px 16px",borderBottom:isLast?"none":"1px solid #0d1a0d",transition:"background 0.15s"}}
      onMouseEnter={e=>(e.currentTarget.style.background="#0a160a")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <ProtocolBadge protocolKey={pos.protocol}/>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:13,fontWeight:700,color:"#c8e6c8"}}>{pos.asset}</span>
          <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:isBorrow?"#ff6655":"#446644",border:`1px solid ${isBorrow?"#ff665533":"#44664433"}`,padding:"1px 5px",borderRadius:2}}>{pos.type.toUpperCase()}</span>
        </div>
        <ChainBadge chainKey={pos.chain} small/>
      </div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:12,color:isBorrow?"#ff6655":"#8ab88a",textAlign:"right"}}>{isBorrow?"-":""}{fmt(Math.abs(pos.deposited))} {pos.asset.split("/")[0]}</div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:12,color:isBorrow?"#ff665599":"#446644",textAlign:"right"}}>{isBorrow?"−":""}{fmtUSD(Math.abs(pos.deposited)*priceOf(pos.asset.split("/")[0]))}</div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:12,color:pos.earned>=0?"#00ff88":"#ff4455",textAlign:"right"}}>{pos.earned>=0?"+":""}{fmt(pos.earned)}</div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:13,fontWeight:700,color:"#00ff88",textAlign:"right"}}>{fmt(pos.apy)}%</div>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:12,textAlign:"right",color:pos.healthFactor==null?"#2a3a2a":pos.healthFactor>2?"#00ff88":pos.healthFactor>1.2?"#f59e0b":"#ff4455"}}>
        {pos.healthFactor==null?"—":fmt(pos.healthFactor,2)}
      </div>
      <div style={{textAlign:"right"}}>
        <span style={{fontFamily:"'Courier New',monospace",fontSize:9,padding:"2px 6px",borderRadius:2,background:pos.status==="active"?"#00ff8822":"#ff880011",color:pos.status==="active"?"#00ff88":"#ff8800",border:`1px solid ${pos.status==="active"?"#00ff8833":"#ff880033"}`,letterSpacing:1}}>
          {pos.status==="active"?"● LIVE":"○ TESTNET"}
        </span>
      </div>
    </div>
  );
}

function ChainBreakdown({ positions }: { positions: any[] }) {
  const byChain: Record<string,{totalUSD:number;count:number}> = {};
  positions.forEach(p => {
    if (!byChain[p.chain]) byChain[p.chain]={totalUSD:0,count:0};
    byChain[p.chain].totalUSD += Math.abs(p.deposited)*priceOf(p.asset.split("/")[0]);
    byChain[p.chain].count++;
  });
  const total = Object.values(byChain).reduce((s,v)=>s+v.totalUSD,0);
  return (
    <div style={{background:"#080f08",border:"1px solid #1a2a1a",padding:16}}>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#446644",letterSpacing:2,marginBottom:12}}>CHAIN EXPOSURE</div>
      {Object.entries(byChain).map(([chainKey,data])=>{
        const chain=CHAINS[chainKey as keyof typeof CHAINS]; if(!chain)return null;
        const pct=total>0?(data.totalUSD/total)*100:0;
        return (
          <div key={chainKey} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontFamily:"'Courier New',monospace",fontSize:10,color:chain.color}}>{chain.logo} {chain.name}</span>
              <span style={{fontFamily:"'Courier New',monospace",fontSize:10,color:"#8ab88a"}}>{fmtUSD(data.totalUSD)} ({fmt(pct,1)}%)</span>
            </div>
            <div style={{height:3,background:"#1a2a1a",borderRadius:2}}>
              <div style={{width:`${pct}%`,height:"100%",background:chain.color,borderRadius:2,boxShadow:`0 0 6px ${chain.color}66`,transition:"width 0.6s ease"}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProtocolCards() {
  return (
    <div style={{background:"#080f08",border:"1px solid #1a2a1a",padding:16}}>
      <div style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#446644",letterSpacing:2,marginBottom:12}}>TRACKED PROTOCOLS</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {Object.entries(PROTOCOLS).map(([key,p])=>(
          <div key={key} style={{padding:"12px 14px",border:`1px solid ${p.color}22`,background:`${p.color}08`,borderRadius:2}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:13,fontWeight:700,color:p.color,letterSpacing:1}}>{p.name}</div>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#446644",marginTop:2}}>{p.type}</div>
                <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>{p.chains.map((c:string)=><ChainBadge key={c} chainKey={c} small/>)}</div>
                <div style={{display:"flex",gap:10,marginTop:8}}>
                  {p.docsUrl&&<a href={p.docsUrl} target="_blank" rel="noreferrer" style={{fontFamily:"'Courier New',monospace",fontSize:9,color:p.color,textDecoration:"none",opacity:0.7,letterSpacing:1}}>↗ DOCS</a>}
                  {p.faucet &&<a href={p.faucet}  target="_blank" rel="noreferrer" style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#f59e0b",textDecoration:"none",opacity:0.8,letterSpacing:1}}>⛽ FAUCET</a>}
                </div>
              </div>
              <div style={{fontFamily:"'Courier New',monospace",fontSize:9,color:p.status==="live"?"#00ff88":"#ff8800",border:`1px solid ${p.status==="live"?"#00ff8822":"#ff880022"}`,padding:"2px 8px",letterSpacing:1}}>
                {p.status==="live"?"● LIVE":"○ TESTNET"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChainBalanceRow({ chainKey }: { chainKey: string }) {
  const { balances } = useWalletContext();
  const chain = CHAINS[chainKey as keyof typeof CHAINS];
  const bal   = balances[chainKey];
  if (!chain) return null;
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #0d1a0d",transition:"background 0.15s"}}
      onMouseEnter={e=>(e.currentTarget.style.background="#0a160a")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <ChainBadge chainKey={chainKey} small/>
        <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#2a4a2a"}}>ID: {chain.id} · {(chain as any).stack}</span>
      </div>
      <div style={{textAlign:"right"}}>
        <span style={{fontFamily:"'Courier New',monospace",fontSize:15,fontWeight:700,color:bal?.loading?"#2a4a2a":bal?.error?"#ff445566":"#c8e6c8"}}>
          {bal?.loading?"···":bal?.error?"ERR":bal?.balance??"0.0000"}
        </span>
        <span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#446644",marginLeft:6}}>{chain.nativeCurrency.symbol}</span>
        {bal?.error&&<span style={{fontFamily:"'Courier New',monospace",fontSize:8,color:"#ff445566",marginLeft:8}}>⚠ RPC</span>}
      </div>
    </div>
  );
}

export default function DeFiDashboard() {
  const { status, address, connect, disconnect, refreshBalances, balances } = useWalletContext();
  const connected  = status === "connected";
  const connecting = status === "connecting";
  const noProvider = status === "no-provider";

  const [positions,      setPositions]      = useState<any[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [activeTab,      setActiveTab]      = useState("positions");
  const [filterChain,    setFilterChain]    = useState("all");
  const [filterProtocol, setFilterProtocol] = useState("all");
  const [lastRefresh,    setLastRefresh]    = useState<Date|null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(()=>{ const id=setInterval(()=>setCurrentTime(new Date()),1000); return()=>clearInterval(id); },[]);

  useEffect(()=>{
    if(connected){ setPositions(generateMockPositions()); setLastRefresh(new Date()); }
    else { setPositions([]); }
  },[connected]);

  const handleRefresh = useCallback(async()=>{
    if(!connected) return;
    setLoading(true);
    refreshBalances();
    setPositions(generateMockPositions());
    setLastRefresh(new Date());
    setTimeout(()=>setLoading(false),1500);
  },[connected,refreshBalances]);

  const totalDeposited = positions.filter(p=>p.deposited>0).reduce((s,p)=>s+p.deposited*priceOf(p.asset.split("/")[0]),0);
  const totalBorrowed  = positions.filter(p=>p.deposited<0).reduce((s,p)=>s+Math.abs(p.deposited)*priceOf(p.asset.split("/")[0]),0);
  const totalEarned    = positions.filter(p=>p.earned>0).reduce((s,p)=>s+p.earned*priceOf(p.asset.split("/")[0]),0);
  const avgAPY         = positions.length>0 ? positions.reduce((s,p)=>s+p.apy,0)/positions.length : 0;
  const PRICES: Record<string,number> = {G:0.42,ETH:3240,USDC:1,USD:1};
  // Tempo has no meaningful native gas balance; exclude it from the "Native Balance" USD total.
  const nativeUSD = Object.values(balances).reduce((sum,b)=>(
    b.chainKey === "tempoTestnet" ? sum : sum + (parseFloat(b.balance)||0) * (PRICES[b.symbol] ?? 0)
  ),0);
  const filtered = positions.filter(p=>(filterChain==="all"||p.chain===filterChain)&&(filterProtocol==="all"||p.protocol===filterProtocol));
  const TABS = [{id:"positions",label:"POSITIONS"},{id:"balances",label:"BALANCES"},{id:"protocols",label:"PROTOCOLS"},{id:"chains",label:"CHAIN MAP"}];
  const headerChains = ["gravityMainnet","tempoTestnet","arcTestnet","giwaTestnet","robinhoodTestnet"];

  return (
    <div style={{background:"#030803",minHeight:"100vh",color:"#8ab88a",fontFamily:"'Courier New',monospace"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1000,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)"}}/>
      <TickerBar/>

      {/* Header */}
      <div style={{borderBottom:"1px solid #1a2a1a",padding:"12px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#050d05"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#00ff88",letterSpacing:4,textShadow:"0 0 20px #00ff8866"}}>◈ DEFI/TRACK</div>
            <div style={{fontSize:9,color:"#446644",letterSpacing:2,marginTop:2}}>MULTI-CHAIN PORTFOLIO TERMINAL</div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{headerChains.map(k=><ChainBadge key={k} chainKey={k} small/>)}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:10,color:"#2a3a2a",textAlign:"right"}}>
            <div>{currentTime?.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) ?? "—"}</div>
            <div style={{color:"#446644",fontSize:12,fontWeight:700}}>{currentTime?.toLocaleTimeString("en-US",{hour12:false}) ?? "···"}</div>
          </div>
          {connected&&<button onClick={handleRefresh} disabled={loading} style={{background:"transparent",border:"1px solid #1a2a1a",color:"#446644",padding:"5px 10px",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10,letterSpacing:1,opacity:loading?0.5:1}}>{loading?"LOADING...":"↻ REFRESH"}</button>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <button onClick={connected?disconnect:connect} disabled={connecting}
              style={{background:connected?"#001a00":"transparent",border:`1px solid ${connected?"#00ff8844":"#446644"}`,color:connected?"#00ff88":"#8ab88a",padding:"6px 14px",fontFamily:"'Courier New',monospace",fontSize:11,letterSpacing:1,cursor:connecting?"wait":"pointer",display:"flex",alignItems:"center",gap:6,opacity:connecting?0.6:1,transition:"all 0.2s"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#00ff88";(e.currentTarget as HTMLButtonElement).style.color="#00ff88";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor=connected?"#00ff8844":"#446644";(e.currentTarget as HTMLButtonElement).style.color=connected?"#00ff88":"#8ab88a";}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:connected?"#00ff88":connecting?"#f59e0b":"#446644",boxShadow:connected?"0 0 6px #00ff88":"none",display:"inline-block"}}/>
              {connecting?"CONNECTING...":connected?shortAddr(address!):"CONNECT WALLET"}
            </button>
            {noProvider&&<span style={{fontFamily:"'Courier New',monospace",fontSize:9,color:"#ff4455",letterSpacing:1}}>⚠ No wallet — install <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{color:"#ff8844"}}>MetaMask</a></span>}
          </div>
        </div>
      </div>

      {/* Not connected */}
      {!connected&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:24}}>
          <div style={{fontSize:60,textAlign:"center",opacity:0.3,filter:"grayscale(1)"}}>◈</div>
          <div style={{fontFamily:"'Courier New',monospace",fontSize:13,color:"#446644",letterSpacing:2,textAlign:"center"}}>
            NO WALLET CONNECTED<br/><span style={{fontSize:10,opacity:0.6}}>Connect wallet to view positions across all 5 chains</span>
          </div>
          {noProvider&&<div style={{fontFamily:"'Courier New',monospace",fontSize:11,color:"#ff4455",letterSpacing:1}}>⚠ No wallet detected — <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{color:"#ff8844"}}>install MetaMask</a></div>}
          <button onClick={connect} disabled={connecting}
            style={{background:"#001a00",border:"1px solid #00ff8866",color:"#00ff88",padding:"12px 32px",fontFamily:"'Courier New',monospace",fontSize:12,letterSpacing:3,cursor:"pointer",boxShadow:"0 0 20px #00ff8822",transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 30px #00ff8844"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 0 20px #00ff8822"}>
            {connecting?"CONNECTING...":"[ CONNECT WALLET ]"}
          </button>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            {Object.entries(PROTOCOLS).map(([k,p])=>(
              <div key={k} style={{padding:"6px 12px",border:`1px solid ${p.color}22`,background:`${p.color}08`,fontFamily:"'Courier New',monospace",fontSize:10,color:p.color,letterSpacing:1}}>{p.tag}</div>
            ))}
          </div>
        </div>
      )}

      {/* Connected */}
      {connected&&(
        <div style={{padding:"20px 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,marginBottom:20,border:"1px solid #1a2a1a",background:"#1a2a1a"}}>
            <StatCard label="TOTAL DEPOSITED" value={fmtUSD(totalDeposited)} sub={`${positions.filter(p=>p.deposited>0).length} active positions`} accent="#00ff88"/>
            <StatCard label="NATIVE BALANCE"  value={fmtUSD(nativeUSD)} sub="live on-chain reads" accent="#00ffcc"/>
            <StatCard label="TOTAL EARNED"    value={`+${fmtUSD(totalEarned)}`} sub="unrealized yield" accent="#00cc66"/>
            <StatCard label="AVG APY"         value={`${fmt(avgAPY)}%`} sub="weighted average" accent="#f59e0b" blink={true}/>
          </div>

          <div style={{display:"flex",gap:0,borderBottom:"1px solid #1a2a1a"}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{background:activeTab===tab.id?"#0a160a":"transparent",border:"none",borderBottom:activeTab===tab.id?"2px solid #00ff88":"2px solid transparent",color:activeTab===tab.id?"#00ff88":"#446644",padding:"10px 20px",fontFamily:"'Courier New',monospace",fontSize:10,letterSpacing:2,cursor:"pointer",transition:"all 0.15s"}}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* POSITIONS */}
          {activeTab==="positions"&&(
            <div style={{border:"1px solid #1a2a1a",borderTop:"none"}}>
              <div style={{display:"flex",gap:8,padding:"10px 16px",borderBottom:"1px solid #0d1a0d",background:"#050d05",alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:9,color:"#446644",letterSpacing:1}}>FILTER:</span>
                {["all",...Object.keys(CHAINS)].map(key=>(
                  <button key={key} onClick={()=>setFilterChain(key)} style={{background:filterChain===key?"#00ff8822":"transparent",border:`1px solid ${filterChain===key?"#00ff8844":"#1a2a1a"}`,color:filterChain===key?"#00ff88":"#446644",padding:"2px 8px",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:1,cursor:"pointer",borderRadius:2}}>
                    {key==="all"?"ALL CHAINS":CHAINS[key as keyof typeof CHAINS]?.shortName}
                  </button>
                ))}
                <span style={{fontSize:9,color:"#2a3a2a",marginLeft:8}}>|</span>
                {["all",...Object.keys(PROTOCOLS)].map(key=>(
                  <button key={key} onClick={()=>setFilterProtocol(key)} style={{background:filterProtocol===key?"#00ff8822":"transparent",border:`1px solid ${filterProtocol===key?"#00ff8844":"#1a2a1a"}`,color:filterProtocol===key?"#00ff88":"#446644",padding:"2px 8px",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:1,cursor:"pointer",borderRadius:2}}>
                    {key==="all"?"ALL PROTOCOLS":PROTOCOLS[key as keyof typeof PROTOCOLS]?.tag}
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 110px 100px 80px 80px 90px",padding:"6px 16px",background:"#050d05",borderBottom:"1px solid #0d1a0d"}}>
                {["PROTOCOL / ASSET","AMOUNT","USD VALUE","EARNED","APY","HEALTH","STATUS"].map(h=>(
                  <div key={h} style={{fontFamily:"'Courier New',monospace",fontSize:8,color:"#2a4a2a",letterSpacing:2,textAlign:h==="PROTOCOL / ASSET"?"left":"right"}}>{h}</div>
                ))}
              </div>
              {filtered.length===0
                ?<div style={{padding:"40px 16px",textAlign:"center",color:"#2a3a2a",fontSize:11}}>NO POSITIONS FOUND</div>
                :filtered.map((pos,i)=><PositionRow key={pos.id} pos={pos} isLast={i===filtered.length-1}/>)
              }
              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 16px",borderTop:"1px solid #0d1a0d",background:"#050d05"}}>
                <span style={{fontSize:9,color:"#2a4a2a"}}>{filtered.length} POSITION{filtered.length!==1?"S":""} · {lastRefresh?.toLocaleTimeString("en-US",{hour12:false})} LAST REFRESH</span>
                <span style={{fontSize:9,color:"#2a4a2a"}}>NET: {fmtUSD(totalDeposited-totalBorrowed)}</span>
              </div>
            </div>
          )}

          {/* BALANCES */}
          {activeTab==="balances"&&(
            <div style={{border:"1px solid #1a2a1a",borderTop:"none"}}>
              <div style={{padding:"8px 16px",background:"#050d05",borderBottom:"1px solid #0d1a0d",fontFamily:"'Courier New',monospace",fontSize:9,color:"#2a4a2a",letterSpacing:2}}>
                NATIVE TOKEN BALANCES · LIVE ON-CHAIN READS VIA ETHERS.JS
              </div>
              {Object.keys(CHAINS).map(k=><ChainBalanceRow key={k} chainKey={k}/>)}
              <div style={{padding:"8px 16px",borderTop:"1px solid #0d1a0d",background:"#050d05",fontFamily:"'Courier New',monospace",fontSize:9,color:"#2a4a2a"}}>
                ⓘ Protocol positions appear in POSITIONS tab once contract addresses are added
              </div>
            </div>
          )}

          {/* PROTOCOLS */}
          {activeTab==="protocols"&&(
            <div style={{border:"1px solid #1a2a1a",borderTop:"none",padding:20}}>
              <ProtocolCards/>
            </div>
          )}

          {/* CHAIN MAP */}
          {activeTab==="chains"&&(
            <div style={{border:"1px solid #1a2a1a",borderTop:"none",padding:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <ChainBreakdown positions={positions}/>
                <div style={{background:"#080f08",border:"1px solid #1a2a1a",padding:16}}>
                  <div style={{fontSize:9,color:"#446644",letterSpacing:2,marginBottom:12}}>CHAIN DETAILS</div>
                  {Object.entries(CHAINS).map(([key,chain])=>(
                    <div key={key} style={{padding:"10px 12px",borderLeft:`3px solid ${chain.color}`,marginBottom:8,background:`${chain.color}08`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:11,color:chain.color,fontWeight:700}}>{chain.logo} {chain.name}</div>
                          <div style={{fontSize:9,color:"#446644",marginTop:2}}>ID: {chain.id} · {chain.nativeCurrency.symbol} · {(chain as any).stack}</div>
                          {(chain as any).note&&<div style={{fontSize:9,color:"#2a4a2a",marginTop:2,fontStyle:"italic"}}>{(chain as any).note}</div>}
                          {(chain as any).tps&&<div style={{fontSize:9,color:"#00ffcc",marginTop:2}}>⚡ {(chain as any).tps}</div>}
                        </div>
                        <span style={{fontSize:8,padding:"2px 6px",background:chain.type==="mainnet"?"#00ff8811":"#ff880011",color:chain.type==="mainnet"?"#00ff88":"#ff8800",border:`1px solid ${chain.type==="mainnet"?"#00ff8822":"#ff880022"}`,letterSpacing:1}}>
                          {chain.type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{fontSize:9,color:"#2a3a2a",marginTop:6,wordBreak:"break-all"}}>RPC: {chain.rpc}</div>
                      <div style={{display:"flex",gap:10,marginTop:4}}>
                        <a href={chain.explorer} target="_blank" rel="noreferrer" style={{fontSize:9,color:chain.color,textDecoration:"none",opacity:0.6,letterSpacing:1}}>↗ EXPLORER</a>
                        {(chain as any).faucet&&<a href={(chain as any).faucet} target="_blank" rel="noreferrer" style={{fontSize:9,color:"#f59e0b",textDecoration:"none",opacity:0.8,letterSpacing:1}}>⛽ FAUCET</a>}
                        {(chain as any).bridge&&<a href={(chain as any).bridge} target="_blank" rel="noreferrer" style={{fontSize:9,color:"#8ab88a",textDecoration:"none",opacity:0.7,letterSpacing:1}}>⇄ BRIDGE</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{marginTop:16,padding:"6px 12px",border:"1px solid #0d1a0d",fontSize:9,color:"#2a4a2a",display:"flex",justifyContent:"space-between"}}>
            <span>◈ DEFI/TRACK v0.2.0 · ethers.js v6 · real wallet connect</span>
            <span>NEXT: plug contract addresses into protocols.ts → live positions</span>
          </div>
        </div>
      )}
    </div>
  );
}