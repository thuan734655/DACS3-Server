import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
});

const createChannelSchema = Joi.object({
  workspace_id: objectIdSchema.required().messages({
    "any.required": "Workspace ID is required",
    "string.empty": "Workspace ID cannot be empty",
  }),
  name: Joi.string().required().min(3).max(50).messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 50 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  is_private: Joi.boolean().default(false).messages({
    "boolean.base": "Is private must be a boolean",
  })
});

const updateChannelSchema = Joi.object({
  name: Joi.string().min(3).max(50).messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 50 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  is_private: Joi.boolean().messages({
    "boolean.base": "Is private must be a boolean",
  })
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

const addMemberSchema = Joi.object({
  userId: objectIdSchema.required().messages({
    "any.required": "User ID is required",
    "string.empty": "User ID cannot be empty",
  })
});

export { createChannelSchema, updateChannelSchema, addMemberSchema }; 