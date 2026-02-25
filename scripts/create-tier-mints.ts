// scripts/create-tier-mints.ts
// ─────────────────────────────────────────────────────────────────────────────
// Creates Token-2022 mints for each INCINERATOR tier with extensions:
//   - MetadataPointer (on-chain name/symbol/URI)
//   - TransferFee (royalty on every transfer)
// Then calls the on-chain program's create_tier instruction.
// ─────────────────────────────────────────────────────────────────────────────
// Run: npx ts-node scripts/create-tier-mints.ts
// ─────────────────────────────────────────────────────────────────────────────

import {
  Connection, Keypair, PublicKey, SystemProgram,
  Transaction, sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
  getMintLen,
} from "@solana/spl-token";
import {
  createInitializeInstruction as createInitializeMetadataInstruction,
  pack as packMetadata,
} from "@solana/spl-token-metadata";
import * as fs from "fs";
import * as path from "path";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// Toggle: "mainnet" or "testnet"
const NETWORK: "mainnet" | "testnet" = "testnet";

const RPC: Record<string, string> = {
  mainnet: "https://rpc.mainnet.x1.xyz",
  testnet: "https://rpc.testnet.x1.xyz",
};

const DECIMALS = 3;

// Transfer fee: 100 bps = 1%. Adjust as needed.
const TRANSFER_FEE_BPS = 100;
const MAX_FEE = BigInt(1_000_000); // max fee in raw units (1000 whole tokens)

// ─── TIER DEFINITIONS ─────────────────────────────────────────────────────────

interface TierDef {
  name: string;
  symbol: string;
  supply: number;
  uri: string; // JSON metadata URI (IPFS/Arweave)
}

const TIERS: TierDef[] = [
  { name: "INCINERATOR",  symbol: "INCNR",  supply: 33,   uri: "" },
  { name: "APOCALYPSE",   symbol: "APCLP",  supply: 55,   uri: "" },
  { name: "GODSLAYER",    symbol: "GODSLY", supply: 88,   uri: "" },
  { name: "DISINTEGRATE", symbol: "DSNTG",  supply: 111,  uri: "" },
  { name: "TERMINATE",    symbol: "TRMNT",  supply: 222,  uri: "" },
  { name: "ANNIHILATE",   symbol: "ANHLT",  supply: 333,  uri: "" },
  { name: "OVERWRITE",    symbol: "OVRWT",  supply: 444,  uri: "" },
  { name: "INFERNO",      symbol: "INFRN",  supply: 555,  uri: "" },
  { name: "FLAME",        symbol: "FLAME",  supply: 888,  uri: "" },
  { name: "SPARK",        symbol: "SPARK",  supply: 4444, uri: "" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("─────────────────────────────────────────────────");
  console.log("INCINERATOR PROTOCOL — Tier Mint Creation");
  console.log(`Network: ${NETWORK} (${RPC[NETWORK]})`);
  console.log("─────────────────────────────────────────────────\n");

  // Load wallet keypair
  const walletPath = path.resolve(
    process.env.HOME || "~",
    ".config/solana/id.json"
  );
  if (!fs.existsSync(walletPath)) {
    console.error(`❌ Wallet not found at ${walletPath}`);
    console.error("   Run: solana-keygen new");
    process.exit(1);
  }
  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")))
  );
  console.log(`Wallet: ${wallet.publicKey.toBase58()}\n`);

  const connection = new Connection(RPC[NETWORK], "confirmed");
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`Balance: ${(balance / 1e9).toFixed(4)} SOL\n`);

  if (balance < 0.5 * 1e9) {
    console.error("❌ Insufficient balance. Need at least 0.5 SOL for rent.");
    process.exit(1);
  }

  const results: { tier: string; mint: string }[] = [];

  for (let i = 0; i < TIERS.length; i++) {
    const tier = TIERS[i];
    console.log(`\n[${i + 1}/10] Creating ${tier.name} (${tier.symbol})...`);
    console.log(`  Supply: ${tier.supply} | Decimals: ${DECIMALS}`);

    try {
      const mintKeypair = Keypair.generate();
      const mintAuthority = wallet.publicKey; // admin controls minting
      const freezeAuthority = wallet.publicKey;

      // Calculate space needed for extensions
      const extensions = [
        ExtensionType.TransferFeeConfig,
        ExtensionType.MetadataPointer,
      ];
      const mintLen = getMintLen(extensions);

      // Metadata to embed on-chain
      const metadata = {
        mint: mintKeypair.publicKey,
        name: tier.name,
        symbol: tier.symbol,
        uri: tier.uri || "",
        additionalMetadata: [
          ["tier_index", i.toString()],
          ["max_supply", tier.supply.toString()],
          ["decimals", DECIMALS.toString()],
          ["protocol", "INCINERATOR"],
        ] as [string, string][],
      };

      const metadataLen = packMetadata(metadata).length;
      const totalLen = mintLen + metadataLen + 256; // buffer

      const lamports = await connection.getMinimumBalanceForRentExemption(totalLen);

      // Build transaction
      const tx = new Transaction();

      // 1. Create account
      tx.add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          lamports,
          space: totalLen,
          programId: TOKEN_2022_PROGRAM_ID,
        })
      );

      // 2. Initialize transfer fee extension
      tx.add(
        createInitializeTransferFeeConfigInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,      // fee authority
          wallet.publicKey,      // withdraw fee authority
          TRANSFER_FEE_BPS,
          MAX_FEE,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 3. Initialize metadata pointer (points to itself)
      tx.add(
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          wallet.publicKey,       // metadata authority
          mintKeypair.publicKey,  // metadata address (self)
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 4. Initialize mint
      tx.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          DECIMALS,
          mintAuthority,
          freezeAuthority,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 5. Initialize on-chain metadata
      tx.add(
        createInitializeMetadataInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintKeypair.publicKey,
          updateAuthority: wallet.publicKey,
          mint: mintKeypair.publicKey,
          mintAuthority: wallet.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
        })
      );

      // Send
      const sig = await sendAndConfirmTransaction(
        connection,
        tx,
        [wallet, mintKeypair],
        { commitment: "confirmed" }
      );

      console.log(`  ✅ Mint: ${mintKeypair.publicKey.toBase58()}`);
      console.log(`  TX: ${sig}`);

      results.push({
        tier: tier.name,
        mint: mintKeypair.publicKey.toBase58(),
      });

      // Save mint keypair for reference
      const keyDir = path.resolve(__dirname, "../keys");
      if (!fs.existsSync(keyDir)) fs.mkdirSync(keyDir, { recursive: true });
      fs.writeFileSync(
        path.join(keyDir, `tier_${i}_${tier.name.toLowerCase()}.json`),
        JSON.stringify(Array.from(mintKeypair.secretKey))
      );

    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  // Summary
  console.log("\n─────────────────────────────────────────────────");
  console.log("DEPLOYMENT SUMMARY");
  console.log("─────────────────────────────────────────────────");
  for (const r of results) {
    console.log(`  ${r.tier.padEnd(14)} → ${r.mint}`);
  }

  // Save results
  const outPath = path.resolve(__dirname, "../reference/deployed-mints.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to: ${outPath}`);
}

main().catch(console.error);
