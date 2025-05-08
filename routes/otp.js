import Router from "express";
import verifyOTPController from "../controllers/verifyOTP.js";
import resendOTP from "../controllers/reSendOTP.js";
import validate from "../middlewares/validate_middelware.js";
import otpSchema from "../helper/joi/otp_schema.js";
const router = Router();

router.post("/verify", validate(otpSchema), verifyOTPController);
router.post("/resend", resendOTP);

export default router;
