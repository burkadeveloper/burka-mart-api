const axios = require("axios");

const CHAPA_API_URL = process.env.CHAPA_API_URL;
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

const initializePayment = async (paymentData) => {
  try {
    const response = await axios.post(
      `${CHAPA_API_URL}/transaction/initialize`,
      {
        amount: paymentData.amount,
        currency: "ETB",
        email: paymentData.email,
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        tx_ref: paymentData.tx_ref,
        callback_url: paymentData.callback_url,
        return_url: paymentData.return_url,
        customization: {
          title: "Marketplace",
          description: `Order ${paymentData.order_id}`,
        },
      },
      {
        headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
      },
    );
    if (response.data.status === "success") {
      return response.data.data.checkout_url;
    } else {
      throw new Error(response.data.message || "Chapa initialization failed");
    }
  } catch (error) {
    console.error("Chapa Init Error:", error.response?.data || error.message);
    throw new Error("Payment initialization failed");
  }
};

const verifyPayment = async (tx_ref) => {
  try {
    const response = await axios.get(
      `${CHAPA_API_URL}/transaction/verify/${tx_ref}`,
      {
        headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Chapa Verify Error:", error.response?.data || error.message);
    throw new Error("Payment verification failed");
  }
};

module.exports = { initializePayment, verifyPayment };
