// const SellerRequest = require("../models/SellerRequest");
// const User = require("../models/User");
// const createNotification = require("../utils/notificationHelper");

// // Submit seller request
// const submitRequest = async (req, res) => {
//   try {
//     const { businessType, ...data } = req.body;
//     const userId = req.user._id;
//     const user = await User.findById(userId);
//     if (user.isSeller)
//       return res
//         .status(400)
//         .json({ success: false, message: "Already a seller" });
//     if (user.sellerRequestPending)
//       return res
//         .status(400)
//         .json({ success: false, message: "Request already pending" });

//     const documents = {};
//     if (req.files) {
//       if (req.files.nationalId)
//         documents.nationalId = `/uploads/${req.files.nationalId[0].filename}`;
//       if (req.files.passport)
//         documents.passport = `/uploads/${req.files.passport[0].filename}`;
//       if (req.files.utilityBill)
//         documents.utilityBill = `/uploads/${req.files.utilityBill[0].filename}`;
//       if (req.files.businessLicense)
//         documents.businessLicense = `/uploads/${req.files.businessLicense[0].filename}`;
//       if (req.files.tinCertificate)
//         documents.tinCertificate = `/uploads/${req.files.tinCertificate[0].filename}`;
//     }

//     const requestData = {
//       user: userId,
//       businessType,
//       ...data,
//       documents,
//       status: "pending",
//     };
//     const request = await SellerRequest.create(requestData);

//     user.sellerRequestPending = true;
//     user.sellerRequestId = request._id;
//     await user.save();

//     // Notify admins
//     const admins = await User.find({ role: "admin" });
//     const io = req.app.get("io");
//     for (const admin of admins) {
//       await createNotification(
//         admin._id,
//         "system",
//         "New Seller Verification Request",
//         `${user.name} wants to become a seller.`,
//         { requestId: request._id },
//         io,
//       );
//     }

//     res.json({ success: true, message: "Request submitted" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get all seller requests (admin)
// const getAllRequests = async (req, res) => {
//   const requests = await SellerRequest.find().populate(
//     "user",
//     "name email phone",
//   );
//   res.json({ success: true, requests });
// };

// // Approve request (admin)
// const approveRequest = async (req, res) => {
//   const { requestId } = req.params;
//   const request = await SellerRequest.findById(requestId);
//   if (!request) return res.status(404).json({ success: false });
//   request.status = "approved";
//   request.reviewedAt = new Date();
//   await request.save();

//   const user = await User.findById(request.user);
//   user.isSeller = true;
//   user.sellerRequestPending = false;
//   user.sellerRequestId = null;
//   await user.save();

//   // Notify user
//   const io = req.app.get("io");
//   await createNotification(
//     user._id,
//     "system",
//     "Seller Request Approved",
//     "You can now list products.",
//     null,
//     io,
//   );

//   res.json({ success: true });
// };

// // Reject request (admin)
// const rejectRequest = async (req, res) => {
//   const { requestId } = req.params;
//   const { adminNote } = req.body;
//   const request = await SellerRequest.findById(requestId);
//   if (!request) return res.status(404).json({ success: false });
//   request.status = "rejected";
//   request.adminNote = adminNote;
//   request.reviewedAt = new Date();
//   await request.save();

//   const user = await User.findById(request.user);
//   user.sellerRequestPending = false;
//   user.sellerRequestId = null;
//   await user.save();

//   // Notify user
//   const io = req.app.get("io");
//   await createNotification(
//     user._id,
//     "system",
//     "Seller Request Rejected",
//     adminNote || "Your request was rejected.",
//     null,
//     io,
//   );

//   res.json({ success: true });
// };

// //   try {
// //     const { businessType, ...data } = req.body;
// //     const userId = req.user._id;
// //     const user = await User.findById(userId);
// //     if (user.isSeller)
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Already a seller" });
// //     if (user.sellerRequestPending)
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Request already pending" });

// //     const documents = {};
// //     const fileFields = [
// //       "nationalId",
// //       "passport",
// //       "utilityBill",
// //       "businessLicense",
// //       "tinCertificate",
// //     ];
// //     fileFields.forEach((field) => {
// //       if (req.files && req.files[field]) {
// //         documents[field] = `/uploads/${req.files[field][0].filename}`;
// //       }
// //     });

// //     const requestData = {
// //       user: userId,
// //       businessType,
// //       ...data,
// //       documents,
// //       status: "pending",
// //     };
// //     const request = await SellerRequest.create(requestData);

// //     user.sellerRequestPending = true;
// //     user.sellerRequestId = request._id;
// //     await user.save();

// //     // Notify all admins
// //     const admins = await User.find({ role: "admin" });
// //     const io = req.app.get("io");
// //     for (const admin of admins) {
// //       await createNotification(
// //         admin._id,
// //         "system",
// //         "New Seller Verification Request",
// //         `${user.name} wants to become a seller.`,
// //         { requestId: request._id },
// //         io,
// //       );
// //     }

// //     res.json({
// //       success: true,
// //       message: "Request submitted. You will be notified when reviewed.",
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// const getRequests = async (req, res) => {
//   const requests = await SellerRequest.find()
//     .populate("user", "name email phone")
//     .sort({ createdAt: -1 });
//   res.json({ success: true, requests });
// };

// const updateRequestStatus = async (req, res) => {
//   const { requestId } = req.params;
//   const { status, adminNote } = req.body;
//   const request = await SellerRequest.findById(requestId);
//   if (!request) return res.status(404).json({ success: false });
//   request.status = status;
//   if (adminNote) request.adminNote = adminNote;
//   request.reviewedAt = new Date();
//   if (status === "more_info_needed") {
//     request.adminComments.push({ comment: adminNote });
//   }
//   await request.save();

//   if (status === "approved") {
//     const user = await User.findById(request.user);
//     user.isSeller = true;
//     user.sellerRequestPending = false;
//     user.sellerRequestId = null;
//     await user.save();
//   } else if (status === "rejected" || status === "more_info_needed") {
//     const user = await User.findById(request.user);
//     user.sellerRequestPending = true; // still pending but needs action
//     await user.save();
//   }

//   // Notify user
//   const io = req.app.get("io");
//   let title, message;
//   if (status === "approved") title = "Seller Request Approved";
//   else if (status === "rejected") title = "Seller Request Rejected";
//   else title = "Additional Information Required";
//   message = adminNote || `Your seller request has been ${status}.`;
//   await createNotification(
//     request.user,
//     "system",
//     title,
//     message,
//     { requestId: request._id },
//     io,
//   );

//   res.json({ success: true });
// };

// module.exports = {
//   submitRequest,
//   getAllRequests,
//   approveRequest,
//   rejectRequest,
//   submitRequest,
//   getRequests,
//   updateRequestStatus,
// };
const SellerRequest = require("../models/SellerRequest");
const User = require("../models/User");
const createNotification = require("../utils/notificationHelper");

const submitRequest = async (req, res) => {
  try {
    const { businessType, ...data } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (user.isSeller)
      return res
        .status(400)
        .json({ success: false, message: "Already a seller" });
    if (user.sellerRequestPending)
      return res
        .status(400)
        .json({ success: false, message: "Request already pending" });

    const documents = {};
    if (req.files) {
      if (req.files.nationalId)
        documents.nationalId = `/uploads/${req.files.nationalId[0].filename}`;
      if (req.files.passport)
        documents.passport = `/uploads/${req.files.passport[0].filename}`;
      if (req.files.utilityBill)
        documents.utilityBill = `/uploads/${req.files.utilityBill[0].filename}`;
      if (req.files.businessLicense)
        documents.businessLicense = `/uploads/${req.files.businessLicense[0].filename}`;
      if (req.files.tinCertificate)
        documents.tinCertificate = `/uploads/${req.files.tinCertificate[0].filename}`;
      if (req.files.selfie)
        documents.selfie = `/uploads/${req.files.selfie[0].filename}`;
    }

    const request = await SellerRequest.create({
      user: userId,
      businessType,
      ...data,
      documents,
      status: "pending",
    });

    user.sellerRequestPending = true;
    user.sellerRequestId = request._id;
    await user.save();

    const admins = await User.find({ role: "admin" });
    const io = req.app.get("io");
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "system",
        "New Seller Request",
        `${user.name} wants to become a seller.`,
        { requestId: request._id },
        io,
      );
    }

    res.json({ success: true, message: "Request submitted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRequests = async (req, res) => {
  const requests = await SellerRequest.find()
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
};

const updateRequestStatus = async (req, res) => {
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

  if (status === "approved") {
    const user = await User.findById(request.user);
    user.isSeller = true;
    user.sellerRequestPending = false;
    user.sellerRequestId = null;
    await user.save();
  } else if (status === "rejected" || status === "more_info_needed") {
    const user = await User.findById(request.user);
    user.sellerRequestPending = false; // so they can reapply if needed
    user.sellerRequestId = null;
    await user.save();
  }

  const io = req.app.get("io");
  let title, message;
  if (status === "approved") title = "Seller Request Approved";
  else if (status === "rejected") title = "Seller Request Rejected";
  else title = "Additional Information Required";
  message = adminNote || `Your seller request has been ${status}.`;
  await createNotification(
    request.user,
    "system",
    title,
    message,
    { requestId: request._id },
    io,
  );

  res.json({ success: true });
};

module.exports = { submitRequest, getRequests, updateRequestStatus };
