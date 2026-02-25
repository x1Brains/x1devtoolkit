#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Deploy Anchor programs to mainnet or testnet
# Usage: ./scripts/deploy.sh [mainnet|testnet]
# ─────────────────────────────────────────────────────────────────────────────

set -e

NETWORK="${1:-testnet}"

if [ "$NETWORK" != "mainnet" ] && [ "$NETWORK" != "testnet" ]; then
  echo "❌ Invalid network: $NETWORK"
  echo "Usage: ./scripts/deploy.sh [mainnet|testnet]"
  exit 1
fi

if [ "$NETWORK" = "mainnet" ]; then
  RPC="https://rpc.mainnet.x1.xyz"
  EXPLORER="https://explorer.mainnet.x1.xyz"
  echo "🔴 MAINNET DEPLOYMENT"
  echo "⚠️  This is PRODUCTION. Are you sure? (y/N)"
  read -r confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
else
  RPC="https://rpc.testnet.x1.xyz"
  EXPLORER="https://explorer.testnet.x1.xyz"
  echo "🟡 TESTNET DEPLOYMENT"
fi

echo ""
echo "Network:  $NETWORK"
echo "RPC:      $RPC"
echo "Explorer: $EXPLORER"
echo ""

echo "📦 Building programs..."
anchor build

echo "🚀 Deploying to $NETWORK..."
anchor deploy --provider.cluster "$NETWORK"

echo ""
echo "✅ Deployment complete!"
echo "View on explorer: $EXPLORER"
