import Joi from "joi";

const emailSchema = Joi.string()
  .min(6)
  .max(30)
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  .required()
  .messages({
    "string.empty": "Email is required",
    "string.min": "Email must be at least 6 characters long",
    "string.max": "Email must be at most 30 characters long",
    "string.pattern.base": "Email must be a valid email address",
  });

const contactNumberSchema = Joi.string()
  .min(10)
  .max(10)
  .regex(/^[0-9]+$/)
  .required()
  .messages({
    "string.empty": "Contact number is required",
    "string.min": "Contact number must be at least 10 digits long",
    "string.max": "Contact number must be at most 10 digits long",
    "string.pattern.base": "Contact number can only contain numbers",
  });

const passwordSchema = Joi.string()
  .min(6)
  .max(30)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password must be at most 30 characters long",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  });

export { emailSchema, contactNumberSchema, passwordSchema };
