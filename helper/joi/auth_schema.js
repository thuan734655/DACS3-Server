import Joi from "joi";
import {
  emailSchema,
  contactNumberSchema,
  passwordSchema,
} from "./componets.js";

const usernameSchema = Joi.string()
  .min(3)
  .max(10)
  .regex(/^[a-zA-Z]+$/)
  .required()
  .messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 10 characters long",
    "string.pattern.base": "Username can only contain letters",
  });
const typeLoginSchema = Joi.string()
  .min(1)
  .max(1)
  .valid("S", "E")
  .required()
  .messages({
    "string.empty": "Type is required",
    "string.min": "Type must be at least 1 character long",
    "string.max": "Type must be at most 1 character long",
    "any.only": "Type must be either 'S' or 'E'",
  });
const deviceIDSchema = Joi.string().required().messages({
  "string.empty": "Device ID is required",
});

const loginSchema = Joi.object({
  email: emailSchema.optional(),
  contactNumber: contactNumberSchema.optional(),
  password: passwordSchema,
  type: typeLoginSchema,
  deviceID: deviceIDSchema,
});

const registerSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  contactNumber: contactNumberSchema,
  password: passwordSchema,
});

export { loginSchema, registerSchema };
