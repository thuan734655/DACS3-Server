import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ID format");
  }
  return value;
});

const taskSchema = Joi.object({
  task_id: objectIdSchema.required().messages({
    "any.required": "Task ID is required",
    "string.empty": "Task ID cannot be empty"
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").default("To Do").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done"
  })
});

const createSprintSchema = Joi.object({
  workspace_is: objectIdSchema.required().messages({
    "any.required": "Workspace ID is required",
    "string.empty": "Workspace ID cannot be empty"
  }),
  name: Joi.string().required().min(3).max(100).messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 100 characters long"
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long"
  }),
  goal: Joi.string().allow("").max(500).messages({
    "string.max": "Goal must be at most 500 characters long"
  }),
  start_date: Joi.date().required().messages({
    "any.required": "Start date is required",
    "date.base": "Start date must be a valid date"
  }),
  end_date: Joi.date().required().messages({
    "any.required": "End date is required",
    "date.base": "End date must be a valid date"
  })
});

const updateSprintSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters long",
    "string.max": "Name must be at most 100 characters long"
  }),
  description: Joi.string().allow("").max(500).messages({
    "string.max": "Description must be at most 500 characters long"
  }),
  goal: Joi.string().allow("").max(500).messages({
    "string.max": "Goal must be at most 500 characters long"
  }),
  start_date: Joi.date().messages({
    "date.base": "Start date must be a valid date"
  }),
  end_date: Joi.date().messages({
    "date.base": "End date must be a valid date"
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done"
  }),
  progress: Joi.number().min(0).max(100).messages({
    "number.base": "Progress must be a number",
    "number.min": "Progress must be at least 0",
    "number.max": "Progress must be at most 100"
  }),
  task: Joi.array().items(taskSchema).messages({
    "array.base": "Tasks must be an array"
  })
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

const addTaskSchema = Joi.object({
  task_id: objectIdSchema.required().messages({
    "any.required": "Task ID is required",
    "string.empty": "Task ID cannot be empty"
  }),
  status: Joi.string().valid("To Do", "In Progress", "Done").default("To Do").messages({
    "any.only": "Status must be one of: To Do, In Progress, Done"
  })
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid("To Do", "In Progress", "Done").required().messages({
    "any.required": "Status is required",
    "string.empty": "Status cannot be empty",
    "any.only": "Status must be one of: To Do, In Progress, Done"
  })
});

export {
  createSprintSchema,
  updateSprintSchema,
  addTaskSchema,
  updateTaskStatusSchema
}; 