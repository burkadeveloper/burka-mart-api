const axios = require("axios");
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

const initiatePayout = async (withdrawalRequest, seller) => {
  const { amount, _id: withdrawalId } = withdrawalRequest;
  const {
    bankAccountName,
    bankAccountNumber,
    bankCode,
    teleBirrNumber,
    preferredPayoutMethod,
  } = seller;

  // Determine payout method and build recipient object
  let recipient;
  if (preferredPayoutMethod === "bank") {
    recipient = {
      account_name: bankAccountName,
      account_number: bankAccountNumber,
      bank_code: bankCode,
      amount: amount,
      reference: `withdrawal_${withdrawalId}`,
    };
  } else {
    recipient = {
      account_name: seller.name,
      account_number: teleBirrNumber,
      amount: amount,
      reference: `withdrawal_${withdrawalId}`,
    };
  }

  try {
    const response = await axios.post(
      "https://api.chapa.co/v1/bulk-transfers",
      {
        title: `Marketplace Withdrawal ${withdrawalId}`,
        currency: "ETB",
        bulk_data: [recipient],
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    return { success: true, batchId: response.data?.data?.batch_id };
  } catch (error) {
    console.error("Chapa payout error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};
