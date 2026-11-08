import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Link as RouterLink, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CircularProgress,
  CssBaseline,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import { WalletProvider } from './services/WalletContext';
import { useWallet } from './services/walletContextStore';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return <Container className="route-loading"><Typography>Loading InsureChain…</Typography></Container>;
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#174f46', dark: '#103d36', light: '#dff3ed' },
    secondary: { main: '#d1a66b' },
    background: { default: '#f5f7f5', paper: '#ffffff' },
    text: { primary: '#182725', secondary: '#62716e' },
    success: { main: '#26775e' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 720, letterSpacing: '-0.045em' },
    h2: { fontWeight: 700, letterSpacing: '-0.035em' },
    h3: { fontWeight: 680, letterSpacing: '-0.03em' },
    h4: { fontWeight: 680, letterSpacing: '-0.025em' },
    h5: { fontWeight: 650, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #e7ece8', boxShadow: '0 8px 30px rgba(24, 48, 40, 0.045)' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10, minHeight: 40 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
  },
});

function SiteHeader() {
  const {
    account, shortAccount, isAdmin, networkLabel, isLocalNetwork, walletAvailable,
    connecting, connectWallet, disconnectWallet, switchToLocalNetwork,
  } = useWallet();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const closeMenu = () => setMenuAnchor(null);
  const links = [
    { label: 'Overview', to: '/' },
    ...(account ? [{ label: isAdmin ? 'Admin workspace' : 'My dashboard', to: isAdmin ? '/admin' : '/dashboard' }] : []),
  ];

  return (
    <AppBar position="sticky" elevation={0} className="site-header">
      <Container maxWidth="xl">
        <Toolbar disableGutters className="toolbar">
          <Box component={RouterLink} to="/" className="brand-link" aria-label="InsureChain home">
            <span className="brand-mark">I</span>
            <Box>
              <Typography className="brand-name">InsureChain</Typography>
              <Typography className="brand-caption">CLAIMS, CLEARLY.</Typography>
            </Box>
          </Box>

          <Box className="desktop-nav">
            {links.map((link) => (
              <Button key={link.to} component={NavLink} to={link.to} className="nav-link">
                {link.label}
              </Button>
            ))}
          </Box>

          <Box className="header-actions">
            <Chip
              size="small"
              label={networkLabel}
              className={`network-chip ${isLocalNetwork ? 'network-chip-good' : 'network-chip-warn'}`}
            />
            {!isLocalNetwork && account && (
              <Button className="switch-button" size="small" onClick={switchToLocalNetwork}>Switch network</Button>
            )}
            {account ? (
              <Button className="wallet-button connected-wallet" onClick={disconnectWallet} title="Disconnect this app session">
                <span className="wallet-dot" />{shortAccount}
              </Button>
            ) : (
              <Button variant="contained" className="wallet-button" onClick={connectWallet} disabled={connecting || !walletAvailable}>
                {connecting ? 'Connecting…' : walletAvailable ? 'Connect wallet' : 'MetaMask needed'}
              </Button>
            )}
            <IconButton className="mobile-menu-button" onClick={(event) => setMenuAnchor(event.currentTarget)} aria-label="Open navigation">
              <span className="menu-glyph">☰</span>
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
              {links.map((link) => (
                <MenuItem key={link.to} component={RouterLink} to={link.to} onClick={closeMenu}>{link.label}</MenuItem>
              ))}
              {account && !isLocalNetwork && <MenuItem onClick={() => { closeMenu(); switchToLocalNetwork(); }}>Switch to Hardhat Local</MenuItem>}
              {account && <MenuItem onClick={() => { closeMenu(); disconnectWallet(); }}>Disconnect app session</MenuItem>}
              {!account && <MenuItem disabled={!walletAvailable} onClick={() => { closeMenu(); connectWallet(); }}>Connect wallet</MenuItem>}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
      {account && !isLocalNetwork && (
        <Box className="network-alert-strip">
          <Container maxWidth="xl">
            <Typography variant="body2">Switch MetaMask to Hardhat Local, chain ID 31337, to use InsureChain.</Typography>
          </Container>
        </Box>
      )}
    </AppBar>
  );
}

function AppContent() {
  const { toast, dismissToast, transaction } = useWallet();
  return (
    <>
      <SiteHeader />
      {transaction?.status === 'pending' && (
        <Container maxWidth="xl" className="transaction-banner-wrap">
          <Alert severity="info" icon={<CircularProgress size={17} color="inherit" />}><strong>{transaction.label}</strong> · {transaction.hash ? 'Waiting for local block confirmation…' : 'Confirm the request in MetaMask…'}{transaction.hash && <span className="banner-hash"> · {transaction.hash}</span>}</Alert>
        </Container>
      )}
      {transaction?.status === 'confirmed' && transaction.hash && (
        <Container maxWidth="xl" className="transaction-banner-wrap">
          <Alert severity="success" action={<Button color="inherit" size="small" onClick={() => navigator.clipboard?.writeText(transaction.hash)}>Copy hash</Button>}>
            <strong>{transaction.label} confirmed</strong> · Block {transaction.blockNumber}{transaction.timestamp ? ` · ${new Date(transaction.timestamp * 1000).toLocaleString()}` : ''}<span className="banner-hash"> · {transaction.hash}</span>
          </Alert>
        </Container>
      )}
      <Box component="main" className="app-main">
        <Routes>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/issue" element={<Navigate to="/admin" replace />} />
          <Route path="/viewpolicy" element={<Navigate to="/dashboard" replace />} />
          <Route path="/paypremium" element={<Navigate to="/dashboard" replace />} />
          <Route path="/submitclaim" element={<Navigate to="/dashboard" replace />} />
          <Route path="/approveclaim" element={<Navigate to="/admin" replace />} />
          <Route path="/payclaim" element={<Navigate to="/admin" replace />} />
          <Route path="/claims" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Container className="not-found"><Typography variant="h4">Page not found</Typography><Button component={RouterLink} to="/">Return home</Button></Container>} />
        </Routes>
      </Box>
      <Snackbar open={Boolean(toast)} autoHideDuration={6000} onClose={dismissToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast ? <Alert onClose={dismissToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>{toast.message}</Alert> : undefined}
      </Snackbar>
    </>
  );
}

function AdminRoute() {
  const { isAdmin, workspace } = useWallet();
  if (workspace.loading) return <Container className="route-loading"><Typography>Checking the contract administrator…</Typography></Container>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <WalletProvider><AppContent /></WalletProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
