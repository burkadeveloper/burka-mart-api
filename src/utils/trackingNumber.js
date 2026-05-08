const shortid = require("shortid");

const generateTrackingId = () => {
  return `MP-${shortid.generate().toUpperCase()}`;
};

module.exports = generateTrackingId;
