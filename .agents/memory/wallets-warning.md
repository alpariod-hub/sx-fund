---
name: SX Fund wallet scheme
description: Compromised old wallet addresses and correct new wallet scheme for SX Fund project
---

## COMPROMISED — NEVER USE

- Server Wallet `0x7feEa1A1aB35E8fAFe71f473269C68951f0DB793` — frozen, do not reference
- Smart Wallet `0x83309B8c28B9DbC6386F0C68962D00B33A0bd80c` — Polymarket account, do not use

## CORRECT WALLET SCHEME (confirmed 2026-06-01)

| Role | Who | Address | Device |
|---|---|---|---|
| MINTER_ROLE / Server Wallet | Данил | `0xBCABb197e9BCb7F23E7Ca2AFA1aC6EA7e1cd916C` | ThirdWeb Engine |
| Safe Signer 1 (MM-1) | Данил | `0x190E7aB63A216179c31828495420CB6916d7DB72` | MetaMask |
| Safe Signer 2 (Ra-2) | Данил/Григорий | `0x08DC6Df90587Def28385C9301EeC157d45cA2473` | Family decision |
| Safe address (2-of-2) | — | `0x58D716D9FfaFEb1f918E96856b309C2f5c63e394` | Polygon Mainnet |

Safe создан Данилом 2026-06-01 на app.safe.global. Оба подписанта контролируются Данилом.
Андрей (@alpariod) и Александра (@sasha_damekina) — команда, не подписанты Safe.

**Why:** Old wallets were used in previous dev/test projects (Polymarket, server experiments) and cannot be trusted for production fund operations. New wallets must be created fresh.

**How to apply:** Whenever displaying wallet addresses in any page, only show `INFRASTRUCTURE.safeAddress` and `INFRASTRUCTURE.deployerWallet` (both currently "TBD"). Never hardcode old 0x7feE or 0x83309B8c addresses.
