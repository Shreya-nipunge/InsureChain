# InsureChain frontend

InsureChain is a React/Vite interface for the local Hardhat insurance contract. It uses MetaMask for writes and reads contract data from `http://127.0.0.1:8545`.

## Start locally

Start the Hardhat chain and deploy the contract from the `contracts` folder as described in `../contracts/README.md`. The Vite config reads the generated `../contracts/deployments/localhost/insurance-contract.json` record at startup. To override the address, set `VITE_CONTRACT_ADDRESS` in a local `.env.local` file, then restart Vite.

```powershell
cd D:\BC-MINI-PROJECT\frontend
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite. In MetaMask, connect a local Hardhat test account and switch to **Hardhat Local** (chain ID `31337`). The app can add this network when prompted. Test account credentials are for local development only. Never use them on public networks.

Amounts in forms are entered in ETH and converted to wei before transactions. Claim reasons are public and permanent on-chain, so use dummy text only.

## Checks

```powershell
npm.cmd run lint
npm.cmd run build
```
