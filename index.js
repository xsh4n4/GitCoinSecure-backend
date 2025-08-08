// server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


let bounties = [ /* your mock bounties */ ];
let submissions = [ /* your mock submissions */ ];
let users = {};

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "GitCoin Secure API is running" });
});

app.get("/api/bounties", (req, res) => res.json({ bounties }));

app.post("/api/bounties", (req, res) => {
  const { title, description, reward, deadline, severity, category, company, website, github, email, scope, rules } = req.body;
  const newBounty = {
    id: bounties.length + 1,
    title,
    description,
    reward: reward + " ETH",
    deadline,
    severity,
    category,
    company,
    website,
    github,
    email,
    scope,
    rules,
    status: "active",
    submissions: 0,
    createdAt: new Date().toISOString().split("T")[0],
    creator: "0x0000...0000"
  };
  bounties.push(newBounty);
  res.json({ bounty: newBounty });
});

app.get("/api/bounties/:id", (req, res) => {
  const bounty = bounties.find(b => b.id === parseInt(req.params.id));
  if (!bounty) return res.status(404).json({ error: "Bounty not found" });
  res.json({ bounty });
});

app.post("/api/submissions", (req, res) => {
  const { bountyId, hunterAddress, title, description, severity, proofOfConcept, recommendation } = req.body;
  const bounty = bounties.find(b => b.id === parseInt(bountyId));
  if (!bounty) return res.status(404).json({ error: "Bounty not found" });
  const newSubmission = {
    id: submissions.length + 1,
    bountyId: parseInt(bountyId),
    bountyTitle: bounty.title,
    hunterAddress,
    title,
    description,
    severity,
    proofOfConcept,
    recommendation,
    status: "pending",
    reward: bounty.reward,
    submittedAt: new Date().toISOString().split("T")[0]
  };
  submissions.push(newSubmission);
  bounty.submissions += 1;
  res.json({ submission: newSubmission });
});

app.get("/api/submissions/user/:address", (req, res) => {
  const userSubmissions = submissions.filter(s => s.hunterAddress === req.params.address);
  res.json({ submissions: userSubmissions });
});

// GitHub OAuth
app.get("/auth/github", (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: "Missing wallet address" });
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  // const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${encodeURIComponent(wallet)}`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize` +
  `?client_id=${process.env.GITHUB_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}` +
  `&scope=user:email` +
  `&state=${encodeURIComponent(wallet)}` +
  `&prompt=consent`; // <- This forces GitHub to show the auth screen

  res.redirect(githubAuthUrl);
});

app.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const wallet = state;
  if (!code || !wallet) return res.status(400).json({ error: "Missing code or wallet" });
  try {
    const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_CALLBACK_URL
    }, {
      headers: { Accept: "application/json" }
    });

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` }
    });

    const githubUser = userResponse.data;
    const emailResponse = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${accessToken}` }
    });

    const userEmail = emailResponse.data.find(e => e.primary && e.verified)?.email || githubUser.email;
    const address = wallet.toLowerCase();
    users[address] = {
      walletAddress: address,
      githubId: githubUser.id,
      username: githubUser.login,
      name: githubUser.name || githubUser.login,
      email: userEmail,
      avatarUrl: githubUser.avatar_url,
      isVerified: true,
      connectedAt: new Date().toISOString()
    };

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?github=connected&wallet=${wallet}&username=${githubUser.login}`);
  } catch (error) {
    console.error("GitHub OAuth Error:", error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?github=error&wallet=${wallet}`);
  }
});

app.post("/auth/logout", (req, res) => res.json({ message: "Logged out successfully" }));

app.get("/api/user/:address", (req, res) => {
  const address = req.params.address.toLowerCase();
  const user = users[address];
  res.json({ user: user || {
    walletAddress: address,
    githubId: null,
    username: null,
    name: null,
    email: null,
    avatarUrl: null,
    isVerified: false
  }});
});

app.post("/api/link-wallet", (req, res) => {
  const address = req.body.walletAddress.toLowerCase();
  if (!users[address]) {
    users[address] = {
      walletAddress: address,
      githubId: null,
      username: null,
      name: null,
      email: null,
      avatarUrl: null,
      isVerified: false
    };
  }
  res.json({ message: "Wallet linked successfully", user: users[address] });
});

app.post("/api/disconnect-github", (req, res) => {
  const address = req.body.walletAddress.toLowerCase();
  if (users[address]) {
    users[address] = { ...users[address], githubId: null, username: null, name: null, email: null, avatarUrl: null, isVerified: false };
  }
  res.json({ message: "GitHub disconnected successfully", user: users[address] });
});

app.post("/api/verify-github", (req, res) => {
  const address = req.body.walletAddress.toLowerCase();
  if (users[address]) {
    users[address].isVerified = true;
  }
  res.json({ message: "GitHub account verified", user: users[address] });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`GitCoin Secure backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints available at: http://localhost:${PORT}/api/`);
});
