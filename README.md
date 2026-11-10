# InsureChain — Decentralized Insurance Claim Management

**Claims, Clearly.**

InsureChain is a blockchain-based insurance claim management system developed as a college mini-project. It demonstrates how smart contracts can make insurance policy creation, premium payments, claim submissions, claim decisions, and payouts transparent and verifiable.

Built using Solidity, Hardhat, React, Vite, ethers.js, and MetaMask, the application runs on a local Ethereum-compatible blockchain.

> **Project status:** Functional local blockchain demonstration. No public blockchain deployment. Uses dummy data and Hardhat test ETH only.

---

## Features

### 1. Administrator Dashboard
- Create insurance policies with custom premiums, coverage limits, and validity periods.
- View all created policies and their current statuses.
- Review submitted insurance claims.
- Approve or reject claims.
- Fund the smart contract's payout reserve.
- Process payouts for approved claims.
- Monitor contract balance and on-chain activity.

### 2. Policyholder Dashboard
- Connect a wallet using MetaMask.
- View policies assigned to the connected wallet.
- Pay the exact policy premium.
- Submit eligible insurance claims.
- Track claim submission and decision statuses.
- View completed claim payouts.

### 3. Smart Contract Functionality
- Role-based access control for administrative operations.
- Policy creation and deactivation.
- Premium payment validation.
- Claim eligibility and coverage validation.
- Prevention of duplicate claims.
- Claim approval and rejection.
- Secure payout processing.
- Contract event logging for important operations.

### 4. Blockchain Transparency
Every successful transaction is recorded on the local blockchain.

The application displays:
- Transaction hashes.
- Block numbers.
- Transaction timestamps.
- Policy and claim events.
- Current contract state.

---

## Technology Stack

| Component | Technology |
|---|---|
| Smart Contracts | Solidity |
| Blockchain Development | Hardhat |
| Frontend | React.js |
| Build Tool | Vite |
| Blockchain Interaction | ethers.js |
| Wallet Integration | MetaMask |
| Programming Language | JavaScript |
| Package Manager | npm |
| Development Environment | WSL 2 – Ubuntu |
| Blockchain Network | Hardhat Local |

---

## Project Structure

```text
InsureChain/
│
├── contracts/
│   ├── contracts/
│   │   └── InsuranceContract.sol
│   │
│   ├── scripts/
│   │   └── deploy.js
│   │
│   ├── test/
│   │   └── InsuranceContract.js
│   │
│   ├── deployments/
│   │   └── localhost/
│   │       └── insurance-contract.json
│   │
│   ├── hardhat.config.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Prerequisites

Install the following before running the project:

- Windows with WSL 2 and Ubuntu.
- Node.js 22.x.
- npm 10.x or later.
- Git.
- MetaMask browser extension.

Verify your installations:

```bash
node -v
npm -v
git --version
```

---

## Installation and Setup

### Step 1: Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd InsureChain
```

### Step 2: Install contract dependencies

```bash
cd contracts
npm ci
```

### Step 3: Compile the smart contract

```bash
npx hardhat compile
```

### Step 4: Run smart contract tests

```bash
npm test
```

The project includes 18 smart contract test cases covering policy creation, premium payments, claim submissions, administrative permissions, claim decisions, payouts, and validation.

### Step 5: Start the local blockchain

Open a terminal:

```bash
cd ~/InsureChain/contracts
npm run node
```

Hardhat starts a local JSON-RPC blockchain at:

```text
http://127.0.0.1:8545
```

Network configuration:

| Setting | Value |
|---|---|
| Network Name | Hardhat Local |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency Symbol | ETH |

Keep this terminal running.

### Step 6: Deploy the contract locally

Open a second terminal:

```bash
cd ~/InsureChain/contracts
npm run deploy:local
```

The deployment script deploys `InsuranceContract.sol` to the local Hardhat blockchain.

The generated contract address and deployment information are stored in:

```text
contracts/deployments/localhost/insurance-contract.json
```

**Important:** This is a local deployment only. The contract is not deployed to Ethereum mainnet or any public testnet.

For a fresh local blockchain, stop the Hardhat node, remove the old localhost deployment record, restart the node, and deploy again.

### Step 7: Configure MetaMask

Add the Hardhat Local network to MetaMask:

- Network Name: Hardhat Local
- RPC URL: http://127.0.0.1:8545
- Chain ID: 31337
- Currency Symbol: ETH

Import the required development account using one of the private keys displayed by your local Hardhat node.

Use the first account as the administrator and another account as the policyholder.

Connect MetaMask to the application and approve the connection request.

**Security warning:** Hardhat development accounts and their private keys are publicly known test credentials. Never use them with real funds or public networks.

### Step 8: Start the frontend

Open a third terminal:

```bash
cd ~/InsureChain/frontend
npm ci
npm run dev
```

Open the application:

```text
http://localhost:5173/
```

The frontend connects to the local Hardhat network and uses the deployed contract address.

If the contract is redeployed or its address changes, ensure the frontend deployment configuration is updated and restart the Vite development server.

---

## Running the Application

The application supports two main user workflows.

### Administrator Workflow

1. Connect the administrator MetaMask account.
2. Create an insurance policy for a customer.
3. Monitor premium payments.
4. Review submitted claims.
5. Approve or reject claims.
6. Fund the contract payout reserve.
7. Process approved claim payouts.
8. Verify the resulting blockchain events.

### Policyholder Workflow

1. Connect the policyholder MetaMask account.
2. View assigned insurance policies.
3. Pay the required premium.
4. Submit an eligible insurance claim.
5. Track the claim status.
6. View the final decision and payout status.

---

## Verification

Run frontend checks:

```bash
cd ~/InsureChain/frontend
npm run lint
npm run build
```

Run smart contract tests:

```bash
cd ~/InsureChain/contracts
npm test
```

---

## Security and Limitations

- The project is intended for educational and demonstration purposes.
- All transactions use local Hardhat test ETH.
- No real insurance policies or financial transactions are involved.
- Claim reasons are stored on-chain and are publicly readable.
- Blockchain transactions are immutable.
- Only dummy information should be entered.
- Never store real customer information, sensitive documents, or personal data on the blockchain.
- The project has not undergone a professional smart contract security audit.
- The application is not intended for production insurance operations.

---

## Future Enhancements

- Public testnet deployment.
- Decentralized document storage using IPFS.
- Improved policyholder identity verification.
- Automated claim validation.
- Email and notification integration.
- Advanced analytics and reporting.
- Multi-administrator support.

---

## Authors

Developed as a Blockchain Application Development college mini-project.

**Project:** InsureChain – Decentralized Insurance Claim Management

**Purpose:** Demonstrating transparent insurance workflows using blockchain technology.

---

*InsureChain — Claims, Clearly.*
