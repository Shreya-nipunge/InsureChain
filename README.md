# InsureChain

**InsureChain — Decentralized Insurance Claim Management** is a college demonstration of policy and claim workflows backed by a Solidity smart contract. It uses React, Vite, ethers.js, MetaMask and Hardhat. The application is designed for a local development chain and dummy data only.

## What it does

- Admin creates and deactivates policies.
- Policyholders can view their policies, pay the exact premium and submit one claim per policy.
- Admin reviews claims, records approval or rejection, funds the contract and pays approved claims.
- The dashboards read real policy/claim state and contract events, including transaction hashes and block timestamps.
- Solidity enforces permissions and eligibility; hiding a button in the frontend is not the security boundary.

## Local setup (Windows PowerShell)

Install dependencies once:

```powershell
cd D:\BC-MINI-PROJECT\contracts
npm.cmd ci

cd D:\BC-MINI-PROJECT\frontend
npm.cmd ci
```

Start the local chain in a first terminal:

```powershell
cd D:\BC-MINI-PROJECT\contracts
npm.cmd run node
```

Deploy from a second terminal:

```powershell
cd D:\BC-MINI-PROJECT\contracts
npm.cmd run compile
npm.cmd run deploy:local
```

The deployment script writes `contracts/deployments/localhost/insurance-contract.json`. If that generated file already exists, the script refuses to overwrite it. For a fresh local chain after resetting, stop the node, remove only that deployment record, restart the node, and deploy again.

Start the frontend in another terminal:

```powershell
cd D:\BC-MINI-PROJECT\frontend
npm.cmd run dev
```

Vite reads the local deployment record when it starts. You can override its address with `VITE_CONTRACT_ADDRESS` in `.env.local`; restart Vite after changing the deployment or environment. The frontend always connects to `http://127.0.0.1:8545` and expects chain ID `31337`.

In MetaMask, use the **Hardhat Local** network and locally generated Hardhat test accounts. They contain test ETH only. Never use their development credentials on a public network. The app never requests a private key.

## Verify

```powershell
cd D:\BC-MINI-PROJECT\frontend
npm.cmd run lint
npm.cmd run build

cd D:\BC-MINI-PROJECT\contracts
npm.cmd test
```

Claim reasons are visible to anyone reading the blockchain and cannot be removed. Use dummy text only; do not enter real customer details or documents. Policy premiums, coverage and claim amounts are entered in ETH and converted to wei by the frontend.
