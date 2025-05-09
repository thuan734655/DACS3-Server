import Joi from "joi";
import { emailSchema, contactNumberSchema } from "./componets.js";

const usernameSchema = Joi.string()
  .min(3)
  .max(10)
  .regex(/^[a-zA-Z]+$/)
  .messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 10 characters long",
    "string.pattern.base": "Username can only contain letters",
  });

const updateProfileSchema = Joi.object({
  username: usernameSchema.optional(),
  email: emailSchema.optional(),
  contactNumber: contactNumberSchema.optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

export { updateProfileSchema }; 