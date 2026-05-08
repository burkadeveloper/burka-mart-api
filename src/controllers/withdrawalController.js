const WithdrawalRequest = require("../models/WithdrawalRequest");
const Wallet = require("../models/Wallet");
const { initiatePayout } = require("../services/payoutService");
// @desc    Get all withdrawal requests (admin)
// @route   GET /api/admin/withdrawals
const getAllWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find().populate(
      "user",
      "name email",
    );
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve a withdrawal request
// @route   PUT /api/admin/withdrawals/:id/approve
const approveWithdrawal = async (req, res) => {
  const { requestId } = req.params;

  const request = await WithdrawalRequest.findById(requestId).populate("user");
  if (!request || request.status !== "pending") {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }

  // Initiate payout via Chapa
  const payout = await initiatePayout(request, request.user);
  if (!payout.success) {
    return res
      .status(500)
      .json({ success: false, message: "Payout failed", error: payout.error });
  }

  // Update withdrawal request status
  request.status = "approved";
  request.processedAt = new Date();
  request.batchId = payout.batchId;
  await request.save();

  // Deduct from wallet (same as before)
  const wallet = await Wallet.findOne({ user: request.user });
  if (wallet) {
    wallet.balance -= request.amount;
    wallet.pendingWithdrawal -= request.amount;
    await wallet.save();
  }

  res.json({
    success: true,
    message: "Withdrawal approved and payout initiated",
  });
};

// @desc    Reject a withdrawal request
// @route   PUT /api/admin/withdrawals/:id/reject
const rejectWithdrawal = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Request already processed" });
    }
    request.status = "rejected";
    request.processedAt = new Date();
    await request.save();

    const wallet = await Wallet.findOne({ user: request.user });
    if (wallet) {
      wallet.pendingWithdrawal -= request.amount;
      await wallet.save();
    }
    res.json({ success: true, message: "Withdrawal rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllWithdrawals, approveWithdrawal, rejectWithdrawal };
