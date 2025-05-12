import { Router } from "express";
import {
  loginController,
  registerController,
  resetPasswordController,
  forgotPasswordController,
  verifyEmailController,
} from "../controllers/authController.js";
import validate from "../middlewares/validate_middelware.js";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema
} from "../helper/joi/auth_schema.js";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post(
  "/resetpassword",
  validate(resetPasswordSchema),
  resetPasswordController
);
router.post(
  "/forgotpassword",
  validate(forgotPasswordSchema),
  forgotPasswordController
);

router.post("/veify-email", validate(verifyEmailSchema), verifyEmailController);

export default router;
