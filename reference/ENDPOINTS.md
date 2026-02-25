# X1 Brains — API & Endpoint Reference

> Quick-copy reference for all RPCs, APIs, token mints, program IDs, and endpoints used across x1brains.io

---

## 🌐 RPC Endpoints

| Network  | RPC URL                          | Explorer                              |
|----------|----------------------------------|---------------------------------------|
| Mainnet  | `https://rpc.mainnet.x1.xyz`    | `https://explorer.mainnet.x1.xyz`     |
| Testnet  | `https://rpc.testnet.x1.xyz`    | `https://explorer.testnet.x1.xyz`     |

**Explorer TX link pattern:**
```
https://explorer.mainnet.x1.xyz/tx/{TX_SIGNATURE}
https://explorer.testnet.x1.xyz/tx/{TX_SIGNATURE}
```

---

## 🪙 Token Mints

| Token   | Mint Address | Program | Notes |
|---------|-------------|---------|-------|
| BRAINS  | `F5fMGaFFcMSNfeMSBG5GTFBqnR1FGRpMJg5z6YDnMLnp` | Token-2022 | Main x1brains token |
| XNT (Wrapped) | `So11111111111111111111111111111111111111112` | SPL Token | X1 Native Token (wrapped) |

---

## 🔑 Program IDs

| Program | ID | Notes |
|---------|-----|-------|
| SPL Token | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | Standard SPL Token program |
| Token-2022 | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` | Token Extensions program (BRAINS uses this) |
| Associated Token | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` | ATA program |
| Metaplex Metadata | `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s` | Token metadata program |

---

## 💰 xDEX API (Price & DEX Data)

**Base URL:** `https://api.xdex.xyz`
**App URL:** `https://app.xdex.xyz`
**Mint Portal:** `https://mint.xdex.xyz`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/token-price/prices?network=X1%20Mainnet&token_addresses={MINT}` | GET | Get token price by mint address |
| `/api/token-price/price?network=mainnet&address={MINT}` | GET | Get single token price |
| `/api/xendex/mint/list?network=mainnet` | GET | List all registered mints |
| `/api/xendex/pool/list?network=mainnet` | GET | List all liquidity pools |
| `/api/xendex/pool/{POOL_ADDR}?network=mainnet` | GET | Get specific pool details |
| `/api/xendex/pool/status?network=mainnet` | GET | Pool status overview |
| `/api/xendex/chart/price?network=mainnet&address={MINT}` | GET | Price chart data for a token |
| `/api/xendex/wallet/tokens/pool?network=mainnet&wallet={WALLET}` | GET | Get user's LP positions |

**Proxy (x1brains.io Vercel):**
All xDEX calls on x1brains.io go through a Vercel proxy to avoid CORS:
```
/api/xdex-price/api/...  →  https://api.xdex.xyz/api/...
```

**Example — Fetch BRAINS price:**
```typescript
const BRAINS_MINT = 'F5fMGaFFcMSNfeMSBG5GTFBqnR1FGRpMJg5z6YDnMLnp';

// Direct (from backend/scripts)
const res = await fetch(`https://api.xdex.xyz/api/token-price/prices?network=X1%20Mainnet&token_addresses=${BRAINS_MINT}`);
const data = await res.json();
// data.data[0].price → number

// Via proxy (from x1brains.io frontend)
const res = await fetch(`/api/xdex-price/api/token-price/prices?network=X1%20Mainnet&token_addresses=${BRAINS_MINT}`);
```

---

## ⛏️ XenBlocks

| Endpoint | Description |
|----------|-------------|
| `https://xenblocks.io/v1/leaderboard` | XenBlocks mining leaderboard |
| `https://xenblocks.io/reg-ledger/` | Registration ledger (HTML scrape) |
| `https://explorer.xenblocks.io` | XenBlocks explorer |

**Token logos:**
```
https://explorer.xenblocks.io/tokens/xnm.png
https://explorer.xenblocks.io/tokens/xuni.png
https://explorer.xenblocks.io/tokens/xblk.png
```

---

## 🗄️ Supabase (x1brains.io Backend)

| Config | Value |
|--------|-------|
| Project URL | `https://xbchrxxfnzhsbpncfiar.supabase.co` |
| Anon Key | *(see x1brains constants.ts — do not commit publicly)* |

**Tables:** `labwork_rewards`, `challenges`, `burn_history`

---

## 🌀 IPFS / Arweave Gateways

| Gateway | URL Pattern |
|---------|-------------|
| Pinata | `https://gateway.pinata.cloud/ipfs/{CID}` |
| IPFS.io | `https://ipfs.io/ipfs/{CID}` |
| Cloudflare IPFS | `https://cloudflare-ipfs.com/ipfs/{CID}` |
| dweb.link | `https://dweb.link/ipfs/{CID}` |
| NFT Storage | `https://nftstorage.link/ipfs/{CID}` |
| Arweave | `https://arweave.net/{TX_ID}` |

**URI resolution logic:**
```typescript
// ipfs://CID  →  https://nftstorage.link/ipfs/CID
// ar://TX_ID  →  https://arweave.net/TX_ID
```

---

## 🤖 Cyberdyne (Imperial Citizen Registry)

| Source | URL |
|--------|-----|
| Full Registry (Gist) | `https://gist.githubusercontent.com/jacklevin74/d4c429c3d31e190247fd79b00d92f350/raw/cyberdyne.json` |
| x1brains Profile (Gist) | `https://gist.githubusercontent.com/jacklevin74/e56e53177784e6c7c8ce86df8360e281/raw/cyberdyne_x1brains.json` |
| Old Localtunnel (DEAD) | `https://fifty-rules-watch.loca.lt/api/citizens` |
| Jack's NucBox (internal) | `http://jack-nucbox-m6-ultra.tail515dc.ts.net:8773/api/` |

---

## 🌍 Ecosystem Links

| Project | URL |
|---------|-----|
| x1brains.io | `https://x1brains.io` |
| x1brains.xyz | `https://x1brains.xyz` |
| xDEX | `https://app.xdex.xyz` |
| X1 Punks | `https://x1punks.xyz` |
| APEX Faucet | `https://apexfaucet.xyz` |
| X1 Ninja | `https://x1.ninja` |
| XenBlocks Explorer | `https://explorer.xenblocks.io` |

---

## 📦 NPM Packages Used (x1brains.io)

```
@solana/web3.js           — RPC, transactions, keypairs
@solana/spl-token         — SPL Token & Token-2022 instructions
@solana/wallet-adapter-*  — Wallet connection (Phantom, Solflare, etc.)
@coral-xyz/anchor         — Anchor framework (for programs)
@supabase/supabase-js     — Database client
```

---

## 🛠️ Common Solana Snippets

### Get Token Balance (Token-2022)
```typescript
import { getAssociatedTokenAddressSync, getAccount, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const BRAINS_MINT = new PublicKey('F5fMGaFFcMSNfeMSBG5GTFBqnR1FGRpMJg5z6YDnMLnp');
const ata = getAssociatedTokenAddressSync(BRAINS_MINT, walletPubkey, false, TOKEN_2022_PROGRAM_ID);
const account = await getAccount(connection, ata, 'confirmed', TOKEN_2022_PROGRAM_ID);
const balance = Number(account.amount) / 1e9;
```

### Detect Token Program (SPL vs Token-2022)
```typescript
let progId = TOKEN_PROGRAM_ID;
const ai = await connection.getAccountInfo(mintPubkey);
if (ai?.owner.equals(TOKEN_2022_PROGRAM_ID)) progId = TOKEN_2022_PROGRAM_ID;
```

### Transfer Token (Auto-detect program)
```typescript
const progId = is2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
const senderAta = getAssociatedTokenAddressSync(mint, sender, false, progId, ASSOCIATED_TOKEN_PROGRAM_ID);
const recipientAta = getAssociatedTokenAddressSync(mint, recipient, false, progId, ASSOCIATED_TOKEN_PROGRAM_ID);

const ataIx = createAssociatedTokenAccountInstruction(
  sender, recipientAta, recipient, mint, progId, ASSOCIATED_TOKEN_PROGRAM_ID
);

const transferIx = createTransferCheckedInstruction(
  senderAta, mint, recipientAta, sender, amount, decimals, [], progId
);
```

### Fetch Metaplex Metadata PDA
```typescript
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
  METADATA_PROGRAM_ID
);
```

---

## 🔄 CSP Domains (vercel.json connect-src)

```
'self'
https://xbchrxxfnzhsbpncfiar.supabase.co
https://rpc.mainnet.x1.xyz
https://api.xdex.xyz
https://app.xdex.xyz
http://jack-nucbox-m6-ultra.tail515dc.ts.net:8773
https://gateway.pinata.cloud
https://ipfs.io
https://cloudflare-ipfs.com
https://dweb.link
https://nftstorage.link
https://raw.githubusercontent.com
https://gist.githubusercontent.com
https://mint.xdex.xyz
https://arweave.net
https://x1punks.xyz
https://apexfaucet.xyz
https://explorer.xenblocks.io
https://xenblocks.io
```
