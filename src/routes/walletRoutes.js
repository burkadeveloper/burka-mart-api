const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getWallet,
  requestWithdrawal,
} = require("../controllers/walletController");
const router = express.Router();

router.get("/", protect, getWallet);
router.post("/withdraw", protect, requestWithdrawal);

module.exports = router;
