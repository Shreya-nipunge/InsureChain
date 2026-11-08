import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import InsuranceArtifact from '../abis/InsuranceContract.json';
import {
  CONTRACT_ADDRESS,
  LOCAL_CHAIN_ID,
  LOCAL_CHAIN_ID_HEX,
  LOCAL_RPC_URL,
  createReadContract,
  createReadProvider,
  eventDescription,
  explainError,
} from './insurance';
import { WalletContext } from './walletContextStore';

function shortenAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [workspace, setWorkspace] = useState({
    loading: true,
    error: '',
    admin: '',
    policies: [],
    claims: [],
    events: [],
    balanceWei: 0n,
  });
  const [revision, setRevision] = useState(0);
  const [transaction, setTransaction] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  const notify = useCallback((severity, message) => setToast({ severity, message, id: Date.now() }), []);

  useEffect(() => {
    const ethereum = window.ethereum;
    setWalletAvailable(Boolean(ethereum?.isMetaMask));
    if (!ethereum) return undefined;

    let mounted = true;
    const updateAccounts = (accounts) => {
      if (mounted) setAccount(accounts[0] || '');
    };
    const updateChain = (value) => {
      if (mounted) setChainId(BigInt(value));
    };

    const initialize = async () => {
      try {
        const [accounts, network] = await Promise.all([
          ethereum.request({ method: 'eth_accounts' }),
          new BrowserProvider(ethereum).getNetwork(),
        ]);
        if (!mounted) return;
        updateAccounts(accounts);
        setChainId(network.chainId);
      } catch {
        if (mounted) setChainId(null);
      }
    };
    initialize();
    ethereum.on?.('accountsChanged', updateAccounts);
    ethereum.on?.('chainChanged', updateChain);

    return () => {
      mounted = false;
      ethereum.removeListener?.('accountsChanged', updateAccounts);
      ethereum.removeListener?.('chainChanged', updateChain);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      setWorkspace((current) => ({ ...current, loading: true, error: '' }));
      try {
        const provider = createReadProvider();
        const contract = await createReadContract(provider);
        const [admin, policyTotal, claimTotal, balanceWei] = await Promise.all([
          contract.admin(),
          contract.policyCounter(),
          contract.claimCounter(),
          contract.getContractBalance(),
        ]);

        const policies = await Promise.all(Array.from({ length: Number(policyTotal) }, async (_, index) => {
          const policy = await contract.policies(index + 1);
          const status = await contract.getPolicyStatus(index + 1);
          return {
            id: Number(policy.policyId),
            holder: policy.policyHolder,
            premiumWei: policy.premiumWei,
            coverageWei: policy.coverageWei,
            createdAt: Number(policy.createdAt),
            expiryAt: Number(policy.expiryAt),
            status: Number(status),
            premiumPaid: policy.premiumPaid,
            claimSubmitted: policy.claimSubmitted,
          };
        }));

        const claims = await Promise.all(Array.from({ length: Number(claimTotal) }, async (_, index) => {
          const claim = await contract.claims(index + 1);
          return {
            id: Number(claim.claimId),
            policyId: Number(claim.policyId),
            claimant: claim.claimant,
            amountWei: claim.amountWei,
            reason: claim.reason,
            submittedAt: Number(claim.submittedAt),
            status: Number(claim.status),
          };
        }));

        let events = [];
        try {
          const logs = await contract.queryFilter('*', 0, 'latest');
          const blockNumbers = [...new Set(logs.map((log) => log.blockNumber))];
          const blockEntries = await Promise.all(blockNumbers.map(async (blockNumber) => {
            const block = await provider.getBlock(blockNumber);
            return [blockNumber, block?.timestamp ?? null];
          }));
          const timestamps = new Map(blockEntries);
          events = logs.map((event) => ({
            ...eventDescription(event),
            eventName: event.eventName,
            actor: event.args.policyHolder || event.args.claimant || event.args.admin || '',
            policyId: event.args.policyId ? Number(event.args.policyId) : null,
            claimId: event.args.claimId ? Number(event.args.claimId) : null,
            blockNumber: event.blockNumber,
            timestamp: timestamps.get(event.blockNumber),
            transactionHash: event.transactionHash,
          })).sort((a, b) => b.blockNumber - a.blockNumber);
        } catch {
          // Core dashboard data remains available even if the node limits historical log queries.
        }

        if (!cancelled) setWorkspace({ loading: false, error: '', admin, policies, claims, events, balanceWei });
      } catch (error) {
        if (!cancelled) {
          setWorkspace((current) => ({
            ...current,
            loading: false,
            error: explainError(error),
          }));
        }
      }
    }
    loadWorkspace();
    return () => { cancelled = true; };
  }, [revision]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum?.isMetaMask) {
      notify('error', 'MetaMask was not detected. Install the MetaMask browser extension to connect a wallet.');
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      setAccount(accounts[0] || '');
      setChainId(network.chainId);
      if (network.chainId !== LOCAL_CHAIN_ID) {
        notify('warning', 'Wallet connected. Switch MetaMask to Hardhat Local (chain ID 31337) before sending transactions.');
      } else {
        notify('success', 'Wallet connected to Hardhat Local.');
      }
    } catch (error) {
      notify('error', explainError(error));
    } finally {
      setConnecting(false);
    }
  }, [notify]);

  const switchToLocalNetwork = useCallback(async () => {
    if (!window.ethereum) {
      notify('error', 'Install MetaMask to add or switch to Hardhat Local.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: LOCAL_CHAIN_ID_HEX }] });
    } catch (error) {
      if (error?.code !== 4902) {
        notify('error', explainError(error));
        return;
      }
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: LOCAL_CHAIN_ID_HEX,
            chainName: 'Hardhat Local',
            nativeCurrency: { name: 'Test Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [LOCAL_RPC_URL],
          }],
        });
        notify('success', 'Hardhat Local was added to MetaMask.');
      } catch (addError) {
        notify('error', explainError(addError));
      }
    }
  }, [notify]);

  const disconnectWallet = useCallback(() => {
    // MetaMask does not offer programmatic revocation; this clears the app's local session.
    setAccount('');
    notify('info', 'Wallet disconnected from this app.');
  }, [notify]);

  const executeTransaction = useCallback(async (label, buildTransaction) => {
    if (!account) {
      notify('error', 'Connect your MetaMask wallet before sending a transaction.');
      return null;
    }
    if (chainId !== LOCAL_CHAIN_ID) {
      notify('warning', 'Switch MetaMask to Hardhat Local (chain ID 31337) before sending a transaction.');
      return null;
    }
    if (!CONTRACT_ADDRESS) {
      notify('error', 'The local contract address is missing. Deploy locally and restart the frontend.');
      return null;
    }

    setTransaction({ status: 'pending', label, hash: '', blockNumber: null, timestamp: null });
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== LOCAL_CHAIN_ID) throw new Error('Switch MetaMask to Hardhat Local (chain ID 31337) before sending a transaction.');
      const signer = await provider.getSigner();
      if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase()) throw new Error('The active MetaMask account changed. Refresh your wallet connection and try again.');
      const contract = new Contract(CONTRACT_ADDRESS, InsuranceArtifact.abi, signer);
      const response = await buildTransaction(contract);
      setTransaction({ status: 'pending', label, hash: response.hash, blockNumber: null, timestamp: null });
      const receipt = await response.wait();
      if (!receipt || receipt.status !== 1) throw new Error('The transaction failed on the local blockchain.');
      const block = await provider.getBlock(receipt.blockNumber);
      const result = {
        status: 'confirmed',
        label,
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: block?.timestamp ?? null,
      };
      setTransaction(result);
      notify('success', `${label} confirmed on Hardhat Local.`);
      refresh();
      return receipt;
    } catch (error) {
      const message = explainError(error);
      setTransaction((current) => ({ ...current, status: 'failed', error: message }));
      notify('error', message);
      return null;
    }
  }, [account, chainId, notify, refresh]);

  const isAdmin = Boolean(account && workspace.admin && account.toLowerCase() === workspace.admin.toLowerCase());
  const value = useMemo(() => ({
    account,
    shortAccount: shortenAddress(account),
    chainId,
    isLocalNetwork: chainId === LOCAL_CHAIN_ID,
    networkLabel: chainId === LOCAL_CHAIN_ID ? 'Hardhat Local' : chainId ? `Chain ${chainId}` : 'Network unavailable',
    walletAvailable,
    connecting,
    isAdmin,
    adminAddress: workspace.admin,
    workspace,
    transaction,
    toast,
    connectWallet,
    disconnectWallet,
    switchToLocalNetwork,
    executeTransaction,
    refresh,
    dismissToast: () => setToast(null),
  }), [account, chainId, walletAvailable, connecting, isAdmin, workspace, transaction, toast, connectWallet, disconnectWallet, switchToLocalNetwork, executeTransaction, refresh]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
