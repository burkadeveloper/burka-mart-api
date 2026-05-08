const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const WithdrawalRequest = require("../models/WithdrawalRequest");

// Get user wallet
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    }
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, wallet, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request withdrawal (seller only)
const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });
    }
    // Create withdrawal request
    const request = await WithdrawalRequest.create({
      user: req.user._id,
      amount,
      status: "pending",
    });
    // Optionally freeze the amount (subtract from balance temporarily)
    wallet.pendingWithdrawal = (wallet.pendingWithdrawal || 0) + amount;
    await wallet.save();
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWallet, requestWithdrawal };
