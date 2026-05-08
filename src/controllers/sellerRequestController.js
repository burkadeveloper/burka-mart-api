const SellerRequest = require("../models/SellerRequest");
const User = require("../models/User");
const createNotification = require("../utils/notificationHelper");
const cloudinary = require("../config/cloudinary");

// Helper: upload a single file buffer to Cloudinary
const uploadDocToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

// Submit seller request
const submitRequest = async (req, res) => {
  try {
    const { businessType, ...data } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user.isSeller) {
      return res
        .status(400)
        .json({ success: false, message: "Already a seller" });
    }
    if (user.sellerRequestPending) {
      return res
        .status(400)
        .json({ success: false, message: "Request already pending" });
    }

    // Upload all documents to Cloudinary
    const documents = {};
    if (req.files) {
      const folder = `seller_requests/${userId}`;
      for (const [field, files] of Object.entries(req.files)) {
        if (files && files[0]) {
          const result = await uploadDocToCloudinary(files[0].buffer, folder);
          documents[field] = result.secure_url;
        }
      }
    }

    const requestData = {
      user: userId,
      businessType,
      ...data,
      documents,
      status: "pending",
    };
    const request = await SellerRequest.create(requestData);

    user.sellerRequestPending = true;
    user.sellerRequestId = request._id;
    await user.save();

    // Notify admins
    const admins = await User.find({ role: "admin" });
    const io = req.app.get("io");
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "system",
        "New Seller Verification Request",
        `${user.name} wants to become a seller.`,
        { requestId: request._id },
        io,
      );
    }

    res.json({
      success: true,
      message: "Request submitted. You will be notified when reviewed.",
    });
  } catch (error) {
    console.error("Submit request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all requests (admin)
const getRequests = async (req, res) => {
  try {
    const requests = await SellerRequest.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update request status (admin)
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNote } = req.body;
    const request = await SellerRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false });

    request.status = status;
    if (adminNote) request.adminNote = adminNote;
    request.reviewedAt = new Date();
    if (status === "more_info_needed") {
      request.adminComments = request.adminComments || [];
      request.adminComments.push({ comment: adminNote, createdAt: new Date() });
    }
    await request.save();

    const user = await User.findById(request.user);
    if (status === "approved") {
      user.isSeller = true;
      user.sellerRequestPending = false;
      user.sellerRequestId = null;
    } else if (status === "rejected" || status === "more_info_needed") {
      user.sellerRequestPending = false;
      user.sellerRequestId = null;
    }
    await user.save();

    const io = req.app.get("io");
    let title, message;
    if (status === "approved") {
      title = "Seller Request Approved";
      message =
        adminNote || "Congratulations! Your seller request has been approved.";
    } else if (status === "rejected") {
      title = "Seller Request Rejected";
      message =
        adminNote ||
        "Your seller request was rejected. Please contact support for details.";
    } else {
      title = "Additional Information Required";
      message =
        adminNote || "Please provide more information for your seller request.";
    }
    await createNotification(
      request.user,
      "system",
      title,
      message,
      { requestId: request._id },
      io,
    );

    res.json({ success: true, message: "Request status updated" });
  } catch (error) {
    console.error("Update request status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitRequest,
  getRequests,
  updateRequestStatus,
};
