---
name: SX Fund NFT Contract
description: SXRWA NFT Drop deployed on Polygon Mainnet — addresses, PM2 env vars, governance plan
---

## Contract

- **Name**: SX RWA Fund
- **Symbol**: SXRWA
- **Type**: NFT Drop (ThirdWeb v5.0.7, ERC-721 + AccessControl)
- **Chain**: Polygon Mainnet
- **Address**: `0x5de1bdf2C1e00D74ACcf63d816768C9EB5718404`
- **Deployed**: 2026-05-31
- **Current Admin**: Gnosis Safe `0x58D716D9FfaFEb1f918E96856b309C2f5c63e394` ✅
- **Current Minter**: Server Wallet `0xBCABb197e9BCb7F23E7Ca2AFA1aC6EA7e1cd916C` ✅ (granted 2026-06-01)
- **Revoked**: Embedded wallet `0xBc11c8d034cE0f23ACF00c7A6aF762ebaf60F30e` — no roles

## Gnosis Safe (2-of-2, Polygon)

- **Safe address**: `0x58D716D9FfaFEb1f918E96856b309C2f5c63e394`
- **Signer 1 (MM-1)**: `0x190E7aB63A216179c31828495420CB6916d7DB72` — Данил
- **Signer 2 (Ra-2)**: `0x08DC6Df90587Def28385C9301EeC157d45cA2473` — Данил/Григорий
- **Note**: Both signers physically controlled by Данил (family decision). Effective 1-of-1 security.

## PM2 env vars (set in /var/www/sx-fund/ecosystem.config.js)

- `NFT_CONTRACT_ADDRESS=0x5de1bdf2C1e00D74ACcf63d816768C9EB5718404`
- `NFT_CHAIN=polygon`
- `SERVER_WALLET_ADDRESS=0xBCABb197e9BCb7F23E7Ca2AFA1aC6EA7e1cd916C`
- `SAFE_ADDRESS=0x58D716D9FfaFEb1f918E96856b309C2f5c63e394`
- `SAFE_SIGNER_1=0x190E7aB63A216179c31828495420CB6916d7DB72`
- `SAFE_SIGNER_2=0x08DC6Df90587Def28385C9301EeC157d45cA2473`

## Wallets

- **Server Wallet** (ThirdWeb Engine, Minter ✅): `0xBCABb197e9BCb7F23E7Ca2AFA1aC6EA7e1cd916C`
- **Embedded Wallet** (revoked — no roles): `0xBc11c8d034cE0f23ACF00c7A6aF762ebaf60F30e`

## Governance Plan

### Day 1 — Foundation ✅ COMPLETE (2026-06-01)
1. ✅ ThirdWeb project + Server Wallet
2. ✅ NFT Drop deployed on Polygon
3. ✅ Gnosis Safe 2-of-2 created by Данил
4. ✅ Safe granted DEFAULT_ADMIN_ROLE on contract (ThirdWeb UI)
5. ✅ Embedded wallet Admin revoked
6. ✅ MINTER_ROLE granted to Server Wallet via Safe Transaction Builder (2/2 sigs)

### Day 2 — Metadata ⏳ IN PROGRESS
7. ⏳ Александра uploads 11 deal ZIPs + Excel to Pinata → CID + SHA-256
8. ⏳ Update RWA-SX-001 metadata (total receivable €127,648: CMR #140 + CMR #142)

### Day 3 — Mint
9. Server Wallet mints RWA-SX-001 with real metadata via API

## NFT Metadata Plan (RWA-SX-001)
- Total receivable: **€127,648**
- CMR #140: €112,688 / 23,042 kg / 2026-04-23 / ФГ ГЕНІВСЬКЕ → OSKUTUOTE OY
- CMR #142: €14,960 / 23,042 kg / 2026-05-14 / ФГ ГЕНІВСЬКЕ → OSKUTUOTE OY
- 11 deal folders + Excel → separate ZIP per deal on Pinata

## Important: ThirdWeb NFT Drop uses AccessControl (not Ownable)
- NO `transferOwnership` function — do NOT attempt it
- Admin = DEFAULT_ADMIN_ROLE, managed via `grantRole` / `revokeRole`
- MINTER_ROLE bytes32: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
- Safe Transaction Builder: paste lowercase address `0xbcabb197...` if checksummed version rejected
