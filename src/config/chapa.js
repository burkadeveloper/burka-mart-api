const axios = require("axios");

const CHAPA_API_URL = process.env.CHAPA_API_URL;
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

const chapaAxios = axios.create({
  baseURL: CHAPA_API_URL,
  headers: {
    Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

// Initialize payment
const initializePayment = async (paymentData) => {
  try {
    const response = await chapaAxios.post("/transaction/initialize", {
      amount: paymentData.amount,
      currency: "ETB",
      email: paymentData.email,
      first_name: paymentData.first_name,
      last_name: paymentData.last_name,
      tx_ref: paymentData.tx_ref,
      callback_url: paymentData.callback_url,
      return_url: paymentData.return_url,
      customization: {
        title: "Marketplace Payment",
        description: `Payment for order ${paymentData.order_id}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Verify payment
const verifyPayment = async (tx_ref) => {
  try {
    const response = await chapaAxios.get(`/transaction/verify/${tx_ref}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

module.exports = { initializePayment, verifyPayment };
