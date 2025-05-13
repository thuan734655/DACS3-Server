import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
});

const createWorkspaceSchema = Joi.object({
  name: Joi.string().required().min(3).max(100).messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 100 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  })
});

const updateWorkspaceSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 100 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  })
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

const addMemberSchema = Joi.object({
  userId: objectIdSchema.required().messages({
    "any.required": "User ID is required",
    "string.empty": "User ID cannot be empty",
  }),
  role: Joi.string().valid("Leader", "Member").default("Member").messages({
    "any.only": "Role must be one of: Leader, Member",
  })
});

export { createWorkspaceSchema, updateWorkspaceSchema, addMemberSchema }; 