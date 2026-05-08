const axios = require("axios");
const Product = require("../models/Product");
const Category = require("../models/Category");

// Helper: find products based on user query
async function findProductsForRecommendation(query) {
  const keywords = query.toLowerCase().split(" ");
  const searchTerms = keywords.filter((k) => k.length > 2);
  const products = await Product.find({
    status: "active",
    $or: [
      { title: { $regex: searchTerms.join("|"), $options: "i" } },
      { description: { $regex: searchTerms.join("|"), $options: "i" } },
      { category: { $in: await getCategoryIds(searchTerms) } },
    ],
  })
    .limit(5)
    .populate("category");
  return products;
}

async function getCategoryIds(terms) {
  const categories = await Category.find({
    name: { $regex: terms.join("|"), $options: "i" },
  });
  return categories.map((c) => c._id);
}

// Call Hugging Face Inference API (new router endpoint)
async function callHuggingFace(messages, products) {
  const systemPrompt = `You are a helpful, friendly customer support assistant for "Marketplace", an Ethiopian e‑commerce platform.

Key information about the site:
- Users can buy and sell products.
- Payment is via Chapa (TeleBirr, CBE Birr, cards).
- Sellers earn money in their wallet, can withdraw to bank/TeleBirr.
- Platform commission is 5% on each sale.
- Shipping options: standard (3-5 days), express (1-2 days), pickup.
- Customer support is available via tickets.
- Returns accepted within 7 days of delivery.
- Featured products are highlighted on the homepage.
- Users can chat with sellers directly.
- The site has dark mode and is fully responsive.

Answer questions naturally, be concise, and helpful. If the user asks about products, recommend from the list provided. If the user greets, greet back warmly. Never mention you are an AI. Keep responses under 150 words.`;

  let conversation = "";
  for (const msg of messages.slice(-6)) {
    conversation += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
  }
  const productContext = products
    .map((p) => `${p.title} (ETB ${p.price})`)
    .join(", ");
  const finalPrompt = `${systemPrompt}\n\nRelevant products: ${productContext || "none"}\n\nConversation so far:\n${conversation}\nAssistant:`;

  try {
    const modelId = "mistralai/Mistral-7B-Instruct-v0.3";
    const response = await axios.post(
      `https://router.huggingface.co/hf-inference/models/${modelId}`,
      {
        inputs: finalPrompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          return_full_text: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    let reply =
      response.data[0]?.generated_text || "I'm not sure. Could you rephrase?";
    reply = reply.replace(/^Assistant:\s*/i, "").trim();
    return reply;
  } catch (error) {
    console.error(
      "Hugging Face API error:",
      error.response?.data || error.message,
    );
    // Fallback mock response
    if (products.length > 0) {
      return `I found these products:\n${products.map((p) => `- ${p.title} (ETB ${p.price})`).join("\n")}\nWould you like more details?`;
    } else {
      return "I'm sorry, I couldn't find any products matching your request. Could you try different keywords?";
    }
  }
}

// Main chatbot endpoint
const chatWithBot = async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const messages = [...history, { role: "user", content: message }];
  const recommendedProducts = await findProductsForRecommendation(message);
  const productList = recommendedProducts.map((p) => ({
    id: p._id,
    title: p.title,
    price: p.price,
    image: p.images?.[0] || null,
    url: `/product/${p._id}`,
  }));

  let aiReply;
  try {
    aiReply = await callHuggingFace(messages, recommendedProducts);
  } catch (err) {
    aiReply =
      "I'm having trouble thinking right now. Please try again in a moment.";
  }

  res.json({
    reply: aiReply,
    products: productList,
    timestamp: new Date(),
  });
};

module.exports = { chatWithBot };
