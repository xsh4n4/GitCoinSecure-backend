# GitCoinSecure - Web3 Bug Bounty Platform

A decentralized platform enabling secure bug reporting and bounty payouts with developer verification through GitHub accounts and Web3 wallet login.

## 🚀 Features

- **GitHub Integration**: Seamless OAuth integration for developer verification
- **Web3 Native**: Built on blockchain with smart contracts for transparent bounties
- **Wallet Connection**: Support for multiple wallets via RainbowKit
- **Bug Bounty Management**: Create, submit, and manage bug bounties
- **IPFS Storage**: Decentralized storage for bug reports
- **Reputation System**: Track developer reputation and earnings

## 🏗️ Architecture

1. **Frontend**: React with Vite, Tailwind CSS, Wagmi, RainbowKit
2. **Backend**: Node.js/Express with GitHub OAuth and wallet mapping
3. **Smart Contracts**: Solidity contracts for bounty management
4. **Storage**: IPFS for bug report storage
5. **Database**: SQLite for user and bounty metadata


## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- Git

### 1. Clone and Install Dependencies

```bash
# Install smart contract dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/securehunt-frontend
pnpm install
```

### 2. Environment Configuration

Create `.env` files in the backend directory:

```bash
# backend/.env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback
SESSION_SECRET=your_session_secret_key
PORT=5000
```

### 3. Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/SecureHunt.js --network localhost
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend/securehunt-frontend
pnpm run dev --host
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Configuration

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Application name: SecureHunt
   - Homepage URL: http://localhost:5173
   - Authorization callback URL: http://localhost:5000/auth/github/callback
3. Copy the Client ID and Client Secret to your `.env` file

### Wallet Configuration

Update `frontend/src/config/wagmi.js` with your WalletConnect Project ID:

```javascript
export const config = getDefaultConfig({
  appName: 'SecureHunt',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
});
```

## 📝 Smart Contract Details

### BugBountyFactory.sol
- Creates new bounty contracts
- Tracks all bounties and their owners
- Emits events for bounty creation

### BugBounty.sol
- Manages individual bounty lifecycle
- Handles bug submissions via IPFS hashes
- Processes approvals and payouts
- Supports owner withdrawal after deadline

### GitHubRegistry.sol
- Maps GitHub usernames to wallet addresses
- Tracks developer reputation and earnings
- Provides leaderboard functionality
- Handles developer verification

## 🧪 Testing

```bash
# Run smart contract tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/SecureHunt.js
```

## 🚀 Deployment

### Smart Contracts

```bash
# Deploy to testnet (e.g., Sepolia)
npx hardhat ignition deploy ./ignition/modules/SecureHunt.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### Frontend & Backend

The application can be deployed to various platforms:

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Railway, Render, or any Node.js hosting
- **Database**: Can be upgraded to PostgreSQL for production

## 🔐 Security Considerations

- All smart contracts include proper access controls
- GitHub OAuth provides secure authentication
- Wallet signatures ensure transaction authenticity
- IPFS provides decentralized, tamper-proof storage
- Session management with secure cookies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the smart contract tests for usage examples

## 🔮 Future Enhancements

- Zero-knowledge proof integration for private submissions
- DAO governance for platform decisions
- Mobile app development
- Multi-chain support
- NFT reputation badges
- Advanced analytics dashboard

