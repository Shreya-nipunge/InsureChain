# Local insurance contract demo

This folder contains a Solidity insurance contract and Hardhat tests. All commands below use Hardhat's local test chain; no public network or real funds are needed.

## Install and verify

From PowerShell, run:

```powershell
cd D:\BC-MINI-PROJECT\contracts
npm.cmd ci
npm.cmd run compile
npm.cmd test
```

## Run a local chain and deploy

Open two PowerShell terminals. In the first:

```powershell
cd D:\BC-MINI-PROJECT\contracts
npm.cmd run node
```

In the second:

```powershell
cd D:\BC-MINI-PROJECT\contracts
npm.cmd run deploy:local
```

The deployment script prints the address and administrator, then writes `deployments/localhost/insurance-contract.json`. That file is ignored by Git because it belongs to the local chain. The script refuses to overwrite it. To intentionally deploy again after restarting the local node, remove only that specific deployment record first.

The Hardhat node prints funded dummy account addresses and private keys in its own terminal. They are local development credentials only: do not use them on public networks or share them.

Premiums and payouts are denominated in wei. Claim reasons in the demo should be dummy text because blockchain data is public and permanent.
