import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
});

const createEpicSchema = Joi.object({
  workspace_id: objectIdSchema.required().messages({
    "any.required": "Workspace ID is required",
    "string.empty": "Workspace ID cannot be empty",
  }),
  name: Joi.string().required().min(3).max(100).messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 100 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  start_date: Joi.date().allow(null).messages({
    "date.base": "Start date must be a valid date",
  }),
  end_date: Joi.date().allow(null).messages({
    "date.base": "End date must be a valid date",
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").default("To Do").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done",
  }),
  progress: Joi.number().min(0).max(100).default(0).messages({
    "number.base": "Progress must be a number",
    "number.min": "Progress must be at least 0",
    "number.max": "Progress must be at most 100",
  })
});

const updateEpicSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 100 characters long",
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  start_date: Joi.date().allow(null).messages({
    "date.base": "Start date must be a valid date",
  }),
  end_date: Joi.date().allow(null).messages({
    "date.base": "End date must be a valid date",
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done",
  }),
  progress: Joi.number().min(0).max(100).messages({
    "number.base": "Progress must be a number",
    "number.min": "Progress must be at least 0",
    "number.max": "Progress must be at most 100",
  })
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

export { createEpicSchema, updateEpicSchema }; 