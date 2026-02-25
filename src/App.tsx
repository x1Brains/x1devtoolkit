// src/App.tsx — X1 DevToolkit
// Network toggle, API reference, RPC copy, program templates
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

// ─── FONTS ────────────────────────────────────────────────────────────────────
const ORB  = "'Orbitron', monospace";
const MONO = "'Share Tech Mono', monospace";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const KF = `
  @keyframes scan    { 0%{top:-2px} 100%{top:100%} }
  @keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:#050a0e}
  ::-webkit-scrollbar-thumb{background:#00ffe530;border-radius:2px}
  input::placeholder{color:#2a4a5a}
  input:focus{outline:none!important;border-color:rgba(0,255,229,.5)!important}
  button{cursor:pointer;transition:all .15s}
  button:hover{opacity:.85}
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
`;

// ─── NETWORK CONFIG ───────────────────────────────────────────────────────────
type Network = 'mainnet' | 'testnet';

const NETWORKS: Record<Network, { label: string; rpc: string; explorer: string; color: string }> = {
  mainnet: { label: 'MAINNET', rpc: 'https://rpc.mainnet.x1.xyz', explorer: 'https://explorer.mainnet.x1.xyz', color: '#00ffe5' },
  testnet: { label: 'TESTNET', rpc: 'https://rpc.testnet.x1.xyz', explorer: 'https://explorer.testnet.x1.xyz', color: '#ff9933' },
};

// ─── API REFERENCE ────────────────────────────────────────────────────────────
interface RefEntry {
  label: string;
  value: string;
  desc: string;
}

interface RefCategory {
  name: string;
  icon: string;
  entries: RefEntry[];
}

const API_REF: RefCategory[] = [
  {
    name: 'RPC & Explorers', icon: '🌐',
    entries: [
      { label: 'X1 Mainnet RPC',      value: 'https://rpc.mainnet.x1.xyz',      desc: 'Primary RPC endpoint' },
      { label: 'X1 Testnet RPC',      value: 'https://rpc.testnet.x1.xyz',      desc: 'Testnet RPC endpoint' },
      { label: 'Mainnet Explorer',     value: 'https://explorer.mainnet.x1.xyz', desc: 'Block explorer' },
      { label: 'Testnet Explorer',     value: 'https://explorer.testnet.x1.xyz', desc: 'Testnet explorer' },
      { label: 'Explorer TX Pattern',  value: 'https://explorer.mainnet.x1.xyz/tx/{TX_SIG}', desc: 'Transaction link template' },
    ],
  },
  {
    name: 'Token Mints', icon: '🪙',
    entries: [
      { label: 'BRAINS (Token-2022)',     value: 'F5fMGaFFcMSNfeMSBG5GTFBqnR1FGRpMJg5z6YDnMLnp', desc: 'Main x1brains token' },
      { label: 'XNT Wrapped',             value: 'So11111111111111111111111111111111111111112',       desc: 'X1 Native Token (wrapped)' },
    ],
  },
  {
    name: 'Program IDs', icon: '🔑',
    entries: [
      { label: 'SPL Token',            value: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',   desc: 'Standard SPL Token program' },
      { label: 'Token-2022',           value: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',   desc: 'Token Extensions (BRAINS uses this)' },
      { label: 'Associated Token',     value: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',  desc: 'ATA program' },
      { label: 'Metaplex Metadata',    value: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',   desc: 'Token metadata program' },
    ],
  },
  {
    name: 'xDEX API', icon: '💰',
    entries: [
      { label: 'Base URL',            value: 'https://api.xdex.xyz',                                                            desc: 'xDEX API base' },
      { label: 'App URL',             value: 'https://app.xdex.xyz',                                                            desc: 'xDEX frontend' },
      { label: 'Mint Portal',         value: 'https://mint.xdex.xyz',                                                           desc: 'Token creation portal' },
      { label: 'Token Price',         value: 'https://api.xdex.xyz/api/token-price/prices?network=X1%20Mainnet&token_addresses={MINT}', desc: 'Get token price by mint' },
      { label: 'Single Price',        value: 'https://api.xdex.xyz/api/token-price/price?network=mainnet&address={MINT}',       desc: 'Single token price' },
      { label: 'Mint List',           value: 'https://api.xdex.xyz/api/xendex/mint/list?network=mainnet',                       desc: 'All registered mints' },
      { label: 'Pool List',           value: 'https://api.xdex.xyz/api/xendex/pool/list?network=mainnet',                       desc: 'All liquidity pools' },
      { label: 'Pool Detail',         value: 'https://api.xdex.xyz/api/xendex/pool/{POOL_ADDR}?network=mainnet',               desc: 'Specific pool info' },
      { label: 'Pool Status',         value: 'https://api.xdex.xyz/api/xendex/pool/status?network=mainnet',                     desc: 'Pool status overview' },
      { label: 'Price Chart',         value: 'https://api.xdex.xyz/api/xendex/chart/price?network=mainnet&address={MINT}',      desc: 'Price chart data' },
      { label: 'Wallet LP Positions', value: 'https://api.xdex.xyz/api/xendex/wallet/tokens/pool?network=mainnet&wallet={WALLET}', desc: "User's LP positions" },
    ],
  },
  {
    name: 'XenBlocks', icon: '⛏️',
    entries: [
      { label: 'Leaderboard API',   value: 'https://xenblocks.io/v1/leaderboard',              desc: 'Mining leaderboard' },
      { label: 'Registration Ledger', value: 'https://xenblocks.io/reg-ledger/',                desc: 'Reg ledger (HTML scrape)' },
      { label: 'Explorer',          value: 'https://explorer.xenblocks.io',                     desc: 'XenBlocks explorer' },
      { label: 'XNM Logo',          value: 'https://explorer.xenblocks.io/tokens/xnm.png',     desc: 'XNM token logo' },
      { label: 'XUNI Logo',         value: 'https://explorer.xenblocks.io/tokens/xuni.png',    desc: 'XUNI token logo' },
      { label: 'XBLK Logo',         value: 'https://explorer.xenblocks.io/tokens/xblk.png',    desc: 'XBLK token logo' },
    ],
  },
  {
    name: 'Cyberdyne Registry', icon: '🤖',
    entries: [
      { label: 'Full Registry (Gist)',    value: 'https://gist.githubusercontent.com/jacklevin74/d4c429c3d31e190247fd79b00d92f350/raw/cyberdyne.json', desc: 'All citizens — jacklevin74' },
      { label: 'x1brains Profile (Gist)', value: 'https://gist.githubusercontent.com/jacklevin74/e56e53177784e6c7c8ce86df8360e281/raw/cyberdyne_x1brains.json', desc: 'x1brains-specific data' },
      { label: "Jack's NucBox (internal)", value: 'http://jack-nucbox-m6-ultra.tail515dc.ts.net:8773/api/', desc: 'Direct server (internal only)' },
    ],
  },
  {
    name: 'IPFS / Arweave Gateways', icon: '🌀',
    entries: [
      { label: 'Pinata',         value: 'https://gateway.pinata.cloud/ipfs/{CID}',   desc: 'Pinata IPFS gateway' },
      { label: 'IPFS.io',        value: 'https://ipfs.io/ipfs/{CID}',                desc: 'Public IPFS gateway' },
      { label: 'Cloudflare IPFS', value: 'https://cloudflare-ipfs.com/ipfs/{CID}',   desc: 'Cloudflare gateway' },
      { label: 'dweb.link',      value: 'https://dweb.link/ipfs/{CID}',              desc: 'dweb gateway' },
      { label: 'NFT Storage',    value: 'https://nftstorage.link/ipfs/{CID}',        desc: 'NFT.Storage gateway' },
      { label: 'Arweave',        value: 'https://arweave.net/{TX_ID}',               desc: 'Arweave gateway' },
    ],
  },
  {
    name: 'Supabase', icon: '🗄️',
    entries: [
      { label: 'Project URL', value: 'https://xbchrxxfnzhsbpncfiar.supabase.co', desc: 'x1brains Supabase instance' },
    ],
  },
  {
    name: 'Ecosystem', icon: '🌍',
    entries: [
      { label: 'x1brains.io',       value: 'https://x1brains.io',             desc: 'Main app' },
      { label: 'x1brains.xyz',      value: 'https://x1brains.xyz',            desc: 'Alt domain' },
      { label: 'xDEX',              value: 'https://app.xdex.xyz',            desc: 'DEX app' },
      { label: 'X1 Punks',          value: 'https://x1punks.xyz',             desc: 'NFT project' },
      { label: 'APEX Faucet',       value: 'https://apexfaucet.xyz',          desc: 'Testnet faucet' },
      { label: 'X1 Ninja',          value: 'https://x1.ninja',                desc: 'X1 tools' },
    ],
  },
];

// ─── CODE SNIPPETS ────────────────────────────────────────────────────────────
interface Snippet {
  label: string;
  lang: string;
  code: string;
}

const SNIPPETS: Snippet[] = [
  {
    label: 'Get Token Balance (Token-2022)',
    lang: 'typescript',
    code: `import { getAssociatedTokenAddressSync, getAccount, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const BRAINS_MINT = new PublicKey('F5fMGaFFcMSNfeMSBG5GTFBqnR1FGRpMJg5z6YDnMLnp');
const ata = getAssociatedTokenAddressSync(BRAINS_MINT, walletPubkey, false, TOKEN_2022_PROGRAM_ID);
const account = await getAccount(connection, ata, 'confirmed', TOKEN_2022_PROGRAM_ID);
const balance = Number(account.amount) / 1e9;`,
  },
  {
    label: 'Detect SPL vs Token-2022',
    lang: 'typescript',
    code: `import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

let progId = TOKEN_PROGRAM_ID;
const ai = await connection.getAccountInfo(mintPubkey);
if (ai?.owner.equals(TOKEN_2022_PROGRAM_ID)) progId = TOKEN_2022_PROGRAM_ID;`,
  },
  {
    label: 'Transfer Token (Auto-detect)',
    lang: 'typescript',
    code: `import { getAssociatedTokenAddressSync, createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

const progId = is2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
const senderAta = getAssociatedTokenAddressSync(mint, sender, false, progId, ASSOCIATED_TOKEN_PROGRAM_ID);
const recipientAta = getAssociatedTokenAddressSync(mint, recipient, false, progId, ASSOCIATED_TOKEN_PROGRAM_ID);

// Create ATA if needed
const ataIx = createAssociatedTokenAccountInstruction(
  sender, recipientAta, recipient, mint, progId, ASSOCIATED_TOKEN_PROGRAM_ID
);

// Transfer
const transferIx = createTransferCheckedInstruction(
  senderAta, mint, recipientAta, sender, amount, decimals, [], progId
);`,
  },
  {
    label: 'Fetch Metaplex Metadata PDA',
    lang: 'typescript',
    code: `const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
  METADATA_PROGRAM_ID
);`,
  },
  {
    label: 'Fetch BRAINS Price (xDEX)',
    lang: 'typescript',
    code: `const BRAINS_MINT = 'F5fMGaFFcMSNfeMSBG5GTFBqnR1FGRpMJg5z6YDnMLnp';
const res = await fetch(
  \`https://api.xdex.xyz/api/token-price/prices?network=X1%20Mainnet&token_addresses=\${BRAINS_MINT}\`
);
const data = await res.json();
const price = data?.data?.[0]?.price ?? null;`,
  },
  {
    label: 'Anchor Program Template (Rust)',
    lang: 'rust',
    code: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
  },
  {
    label: 'Anchor - Token Vault (Rust)',
    lang: 'rust',
    code: `use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022, TransferChecked};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod token_vault {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.user_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token_2022::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_ata: AccountInfo<'info>,
    #[account(mut)]
    pub vault_ata: AccountInfo<'info>,
    pub mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}`,
  },
  {
    label: 'Resolve IPFS / Arweave URI',
    lang: 'typescript',
    code: `function resolveUri(raw: string): string {
  if (raw.startsWith('ipfs://'))
    return 'https://nftstorage.link/ipfs/' + raw.slice(7);
  if (raw.startsWith('ar://'))
    return 'https://arweave.net/' + raw.slice(5);
  return raw;
}`,
  },
];

// ─── COPY HELPER ──────────────────────────────────────────────────────────────
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);
  return (
    <button
      onClick={copy}
      style={{
        background: copied ? 'rgba(0,255,229,.15)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${copied ? '#00ffe5' : 'rgba(255,255,255,.1)'}`,
        color: copied ? '#00ffe5' : '#4a7a8a',
        padding: '4px 12px',
        fontFamily: MONO,
        fontSize: 9,
        letterSpacing: '.15em',
        borderRadius: 3,
        flexShrink: 0,
        minWidth: 60,
        textAlign: 'center' as const,
      }}
    >
      {copied ? '✓ COPIED' : label ?? 'COPY'}
    </button>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
type Tab = 'network' | 'apis' | 'snippets' | 'programs';

export default function App() {
  const [network, setNetwork] = useState<Network>('testnet');
  const [tab, setTab] = useState<Tab>('network');
  const [search, setSearch] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const net = NETWORKS[network];

  const TABS: { key: Tab; label: string }[] = [
    { key: 'network',  label: '⚡ NETWORK' },
    { key: 'apis',     label: '📡 API REFERENCE' },
    { key: 'snippets', label: '✂️ SNIPPETS' },
    { key: 'programs', label: '🔧 PROGRAMS' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050a0e', fontFamily: MONO, color: '#c8d8e8', position: 'relative', overflow: 'hidden' }}>
      <style>{KF}</style>

      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,229,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,229,.02) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />
      {/* Scanline */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: `rgba(${network === 'mainnet' ? '0,255,229' : '255,153,51'},.08)`, animation: 'scan 8s linear infinite', pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* ── HEADER ── */}
        <header style={{ textAlign: 'center', marginBottom: 36, animation: 'fadeUp .5s ease' }}>
          <div style={{ fontFamily: ORB, fontSize: 'clamp(20px,4vw,42px)', fontWeight: 900, letterSpacing: '.1em', lineHeight: 1.1, marginBottom: 6, background: `linear-gradient(135deg,${net.color},#0077ff,${net.color})`, backgroundSize: '200% 200%', animation: 'shimmer 4s ease infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            X1 DEV TOOLKIT
          </div>
          <div style={{ fontSize: 10, letterSpacing: '.35em', color: '#004455', textTransform: 'uppercase', fontFamily: MONO }}>
            Developer Reference // Network Config // Program Templates
          </div>
        </header>

        {/* ── NETWORK TOGGLE ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32, animation: 'fadeUp .5s ease .1s both' }}>
          {(['mainnet', 'testnet'] as Network[]).map(n => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              style={{
                background: network === n ? `${NETWORKS[n].color}18` : 'rgba(255,255,255,.03)',
                border: `2px solid ${network === n ? NETWORKS[n].color : 'rgba(255,255,255,.08)'}`,
                color: network === n ? NETWORKS[n].color : '#4a7a8a',
                padding: '12px 32px',
                fontFamily: ORB,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.2em',
                borderRadius: 6,
                boxShadow: network === n ? `0 0 20px ${NETWORKS[n].color}20` : 'none',
                transition: 'all .2s',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: network === n ? NETWORKS[n].color : '#333',
                  boxShadow: network === n ? `0 0 8px ${NETWORKS[n].color}` : 'none',
                  animation: network === n ? 'pulse 2s ease infinite' : 'none',
                }} />
                {NETWORKS[n].label}
              </span>
            </button>
          ))}
        </div>

        {/* ── RPC QUICK COPY ── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap', animation: 'fadeUp .5s ease .15s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${net.color}30`, borderRadius: 6, padding: '10px 16px' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#4a7a8a', letterSpacing: '.2em' }}>RPC</span>
            <code style={{ fontFamily: MONO, fontSize: 12, color: net.color }}>{net.rpc}</code>
            <CopyBtn text={net.rpc} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, padding: '10px 16px' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#4a7a8a', letterSpacing: '.2em' }}>EXPLORER</span>
            <code style={{ fontFamily: MONO, fontSize: 12, color: '#8aabbc' }}>{net.explorer}</code>
            <CopyBtn text={net.explorer} />
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid rgba(0,255,229,.1)', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none',
                borderBottom: tab === t.key ? `2px solid ${net.color}` : '2px solid transparent',
                color: tab === t.key ? net.color : '#4a7a8a',
                padding: '10px 22px',
                fontFamily: ORB, fontSize: 9, letterSpacing: '.18em',
                textTransform: 'uppercase', transition: 'all .2s', marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── NETWORK TAB ── */}
        {tab === 'network' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ fontFamily: ORB, fontSize: 12, fontWeight: 700, letterSpacing: '.3em', color: net.color, marginBottom: 16 }}>
              ⚡ ACTIVE NETWORK — {net.label}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'RPC Endpoint', value: net.rpc },
                { label: 'Block Explorer', value: net.explorer },
                { label: 'TX Link Pattern', value: `${net.explorer}/tx/{TX_SIG}` },
                { label: 'Solana CLI Config', value: `solana config set --url ${net.rpc}` },
                { label: 'Anchor.toml Cluster', value: `cluster = "${network}"` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 4, padding: '14px 16px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '.25em', color: '#4a7a8a', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: '#e0f0ff', wordBreak: 'break-all' }}>{item.value}</div>
                  </div>
                  <CopyBtn text={item.value} />
                </div>
              ))}
            </div>

            <div style={{ fontFamily: ORB, fontSize: 11, letterSpacing: '.2em', color: '#4a7a8a', marginBottom: 12 }}>QUICK COMMANDS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Switch Solana CLI', cmd: `solana config set --url ${net.rpc}` },
                { label: 'Check balance', cmd: `solana balance --url ${net.rpc}` },
                { label: 'Airdrop (testnet)', cmd: 'solana airdrop 2 --url https://rpc.testnet.x1.xyz' },
                { label: 'Anchor build', cmd: 'anchor build' },
                { label: `Anchor deploy (${network})`, cmd: `anchor deploy --provider.cluster ${network}` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 4, padding: '10px 14px' }}>
                  <div>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: '#4a7a8a', marginRight: 12 }}>{item.label}</span>
                    <code style={{ fontFamily: MONO, fontSize: 11, color: net.color }}>{item.cmd}</code>
                  </div>
                  <CopyBtn text={item.cmd} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── API REFERENCE TAB ── */}
        {tab === 'apis' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="SEARCH APIs, ENDPOINTS, MINTS..."
                style={{ width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(0,255,229,.2)', borderRadius: 4, padding: '12px 16px', color: '#e0f0ff', fontFamily: MONO, fontSize: 13 }}
              />
            </div>

            {API_REF.map(cat => {
              const filtered = search
                ? cat.entries.filter(e =>
                    e.label.toLowerCase().includes(search.toLowerCase()) ||
                    e.value.toLowerCase().includes(search.toLowerCase()) ||
                    e.desc.toLowerCase().includes(search.toLowerCase())
                  )
                : cat.entries;
              if (search && filtered.length === 0) return null;
              const isOpen = !search && expandedCat !== null ? expandedCat === cat.name : true;

              return (
                <div key={cat.name} style={{ marginBottom: 20 }}>
                  <div
                    onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}
                  >
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontFamily: ORB, fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: net.color }}>{cat.name.toUpperCase()}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: '#4a7a8a' }}>({filtered.length})</span>
                    <span style={{ marginLeft: 'auto', color: '#4a7a8a', fontSize: 10 }}>{isOpen ? '▼' : '▶'}</span>
                  </div>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {filtered.map(entry => (
                        <div key={entry.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 4, padding: '10px 14px' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{ fontFamily: ORB, fontSize: 10, color: '#e0f0ff', fontWeight: 700 }}>{entry.label}</span>
                              <span style={{ fontFamily: MONO, fontSize: 8, color: '#3a5a6a' }}>{entry.desc}</span>
                            </div>
                            <code style={{ fontFamily: MONO, fontSize: 10, color: '#6a9aaa', wordBreak: 'break-all', display: 'block' }}>{entry.value}</code>
                          </div>
                          <CopyBtn text={entry.value} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SNIPPETS TAB ── */}
        {tab === 'snippets' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ fontFamily: ORB, fontSize: 12, fontWeight: 700, letterSpacing: '.3em', color: net.color, marginBottom: 16 }}>
              ✂️ CODE SNIPPETS — COPY & PASTE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SNIPPETS.map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, overflow: 'hidden', animation: `fadeUp .3s ease ${i * 0.04}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: ORB, fontSize: 10, color: '#e0f0ff', fontWeight: 700 }}>{s.label}</span>
                      <span style={{ fontFamily: MONO, fontSize: 8, padding: '2px 8px', background: s.lang === 'rust' ? 'rgba(255,107,53,.1)' : 'rgba(0,255,229,.08)', border: `1px solid ${s.lang === 'rust' ? 'rgba(255,107,53,.3)' : 'rgba(0,255,229,.2)'}`, borderRadius: 2, color: s.lang === 'rust' ? '#ff6b35' : '#00ffe5', letterSpacing: '.15em' }}>{s.lang.toUpperCase()}</span>
                    </div>
                    <CopyBtn text={s.code} label="COPY CODE" />
                  </div>
                  <pre style={{ margin: 0, padding: '14px 16px', fontFamily: MONO, fontSize: 11, color: '#8aabbc', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre' }}>{s.code}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROGRAMS TAB ── */}
        {tab === 'programs' && (
          <div style={{ animation: 'fadeUp .4s ease' }}>
            <div style={{ fontFamily: ORB, fontSize: 12, fontWeight: 700, letterSpacing: '.3em', color: net.color, marginBottom: 16 }}>
              🔧 ANCHOR PROGRAMS
            </div>

            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 6, padding: '24px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
              <div style={{ fontFamily: ORB, fontSize: 14, color: '#e0f0ff', letterSpacing: '.1em', marginBottom: 8 }}>PROGRAM WORKSPACE</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#4a7a8a', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
                Anchor/Rust programs will be built and managed here. Each program gets its own card with deploy status, program ID, and quick actions.
              </div>
            </div>

            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '.25em', color: '#4a7a8a', marginBottom: 12 }}>SETUP COMMANDS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Install Anchor', cmd: 'cargo install --git https://github.com/coral-xyz/anchor avm --force && avm install latest && avm use latest' },
                { label: 'Init new program', cmd: 'anchor init my_program --no-git' },
                { label: 'Build all', cmd: 'anchor build' },
                { label: 'Test (localnet)', cmd: 'anchor test' },
                { label: `Deploy to ${network}`, cmd: `anchor deploy --provider.cluster ${network}` },
                { label: 'Get program ID', cmd: 'solana address -k target/deploy/my_program-keypair.json' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 4, padding: '10px 14px' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: '#4a7a8a', marginRight: 12 }}>{item.label}</span>
                    <code style={{ fontFamily: MONO, fontSize: 11, color: net.color }}>{item.cmd}</code>
                  </div>
                  <CopyBtn text={item.cmd} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center', marginTop: 60, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#2a3a4a', letterSpacing: '.2em' }}>
            X1 BRAINS // DEV TOOLKIT // {network.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
