import { emailSchema } from "./componets.js";
import Joi from "joi";

const otpSchema = Joi.object({
  otp: Joi.string()
    .min(6)
    .max(6)
    .regex(/^[0-9]+$/)
    .required()
    .messages({
      "string.empty": "OTP is required",
      "string.min": "OTP must be exactly 6 digits long",
      "string.max": "OTP must be exactly 6 digits long",
      "string.pattern.base": "OTP can only contain numbers",
    }),
  email: emailSchema,
});

export default otpSchema;
