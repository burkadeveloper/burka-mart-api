const express = require("express");
const { chapaWebhook } = require("../controllers/orderController");
const router = express.Router();

router.post(
  "/chapa-webhook",
  express.raw({ type: "application/json" }),
  chapaWebhook,
);
router.post(
  "/payout-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-chapa-signature"];
    const payload = req.body.toString();

    // Verify signature (same as payment webhook)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).send("Unauthorized");
    }

    const event = JSON.parse(payload);
    const { batch_id, status } = event.data;

    if (status === "success") {
      // Update withdrawal requests with this batch_id
      await WithdrawalRequest.updateMany(
        { batchId: batch_id, status: "approved" },
        { status: "completed" },
      );
    }

    res.status(200).send("OK");
  },
);

module.exports = router;
