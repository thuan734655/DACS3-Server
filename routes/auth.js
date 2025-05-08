import { Router } from "express";
import {
  loginController,
  registerController,
} from "../controllers/authController.js";
import validate from "../middlewares/validate_middelware.js";
import { loginSchema, registerSchema } from "../helper/joi/auth_schema.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  registerController
);
router.post(
  "/login",
  validate(loginSchema),
  loginController
);

export default router;
