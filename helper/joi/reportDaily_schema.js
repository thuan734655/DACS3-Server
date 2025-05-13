import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
});

const issueSchema = Joi.object({
  issue: Joi.string().valid("task", "bug").required().messages({
    "any.required": "Issue type is required",
    "string.empty": "Issue type cannot be empty",
    "any.only": "Issue type must be either 'task' or 'bug'"
  }),
  progress: Joi.number().min(0).max(100).messages({
    "number.base": "Progress must be a number",
    "number.min": "Progress must be at least 0",
    "number.max": "Progress must be at most 100"
  })
});

const createReportDailySchema = Joi.object({
  workspace_id: objectIdSchema.required().messages({
    "any.required": "Workspace ID is required",
    "string.empty": "Workspace ID cannot be empty"
  }),
  content: Joi.string().required().min(3).max(1000).messages({
    "any.required": "Content is required",
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 3 characters long",
    "string.max": "Content must be at most 1000 characters long"
  }),
  inprogress: Joi.array().items(issueSchema).messages({
    "array.base": "In-progress issues must be an array"
  }),
  completed: Joi.array().items(issueSchema).messages({
    "array.base": "Completed issues must be an array"
  }),
  date: Joi.date().messages({
    "date.base": "Date must be a valid date"
  })
});

const updateReportDailySchema = Joi.object({
  content: Joi.string().min(3).max(1000).messages({
    "string.empty": "Content cannot be empty",
    "string.min": "Content must be at least 3 characters long",
    "string.max": "Content must be at most 1000 characters long"
  }),
  inprogress: Joi.array().items(issueSchema).messages({
    "array.base": "In-progress issues must be an array"
  }),
  completed: Joi.array().items(issueSchema).messages({
    "array.base": "Completed issues must be an array"
  }),
  date: Joi.date().messages({
    "date.base": "Date must be a valid date"
  })
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

export { createReportDailySchema, updateReportDailySchema };