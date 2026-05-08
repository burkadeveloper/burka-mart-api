const { body, validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    res.status(400).json({ success: false, errors: errors.array() });
  };
};

const registerValidation = [
  body("name").notEmpty().withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("phone").isMobilePhone().withMessage("Valid phone required"),
  body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
];

module.exports = { validate, registerValidation };

const productValidation = [
  body("title").notEmpty().trim(),
  body("price").isNumeric().withMessage("Price must be number"),
  body("category").notEmpty(),
  body("quantity").isInt({ min: 1 }),
];

module.exports = { validate, registerValidation, productValidation };
