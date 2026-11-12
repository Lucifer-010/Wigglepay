#!/usr/bin/env bash
# ==============================================================================
# WigglePay Soroban Smart Contract Deployment Script
# Deploys wigglepay_escrow contract to Stellar Testnet or Mainnet
# ==============================================================================

set -euo pipefail

NETWORK="${1:-testnet}"
echo "🚀 Deploying WigglePay Escrow Smart Contract to network: ${NETWORK}..."

# Ensure soroban-cli or stellar-cli is installed
CLI_CMD="stellar"
if ! command -v stellar &> /dev/null; then
    if command -v soroban &> /dev/null; then
        CLI_CMD="soroban"
    else
        echo "⚠️  Neither 'stellar' nor 'soroban' CLI found in PATH."
        echo "💡 Install via: cargo install --locked stellar-cli --features opt"
        echo "💡 Or use docker image: stellar/quickstart"
        exit 1
    fi
fi

echo "📦 Building contract WASM..."
${CLI_CMD} contract build

WASM_PATH="target/wasm32-unknown-unknown/release/wigglepay_escrow.wasm"
if [ ! -f "${WASM_PATH}" ]; then
    WASM_PATH="../../target/wasm32-unknown-unknown/release/wigglepay_escrow.wasm"
fi

echo "🔐 Optimizing WASM..."
${CLI_CMD} contract optimize --wasm "${WASM_PATH}"

echo "📤 Deploying contract to ${NETWORK}..."
CONTRACT_ID=$(${CLI_CMD} contract deploy \
  --wasm "${WASM_PATH}" \
  --source-account default \
  --network "${NETWORK}")

echo "✅ Contract successfully deployed! CONTRACT_ID: ${CONTRACT_ID}"
echo "📝 Update SOROBAN_ESCROW_CONTRACT_ID in your root .env file with this ID:"
echo "SOROBAN_ESCROW_CONTRACT_ID=${CONTRACT_ID}"

