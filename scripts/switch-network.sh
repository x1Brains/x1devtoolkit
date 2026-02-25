#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# switch-network.sh — Quick toggle Anchor.toml between mainnet/testnet
# Usage: ./scripts/switch-network.sh [mainnet|testnet]
# ─────────────────────────────────────────────────────────────────────────────

set -e

NETWORK="${1:-}"

if [ -z "$NETWORK" ]; then
  CURRENT=$(grep '^cluster' Anchor.toml | head -1 | sed 's/.*= *"\(.*\)"/\1/')
  echo "Current network: $CURRENT"
  echo ""
  echo "Usage: ./scripts/switch-network.sh [mainnet|testnet]"
  exit 0
fi

if [ "$NETWORK" != "mainnet" ] && [ "$NETWORK" != "testnet" ]; then
  echo "❌ Invalid network: $NETWORK"
  exit 1
fi

sed -i "s/^cluster = .*/cluster = \"$NETWORK\"/" Anchor.toml

echo "✅ Switched to $NETWORK"

if [ "$NETWORK" = "mainnet" ]; then
  echo "   RPC: https://rpc.mainnet.x1.xyz"
  echo "   Explorer: https://explorer.mainnet.x1.xyz"
else
  echo "   RPC: https://rpc.testnet.x1.xyz"
  echo "   Explorer: https://explorer.testnet.x1.xyz"
fi
