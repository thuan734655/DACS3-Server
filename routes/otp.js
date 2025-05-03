import Router from "express";
import verifyOTPController from "../controllers/verifyOTP.js";
import resendOTP from "../controllers/reSendOTP.js";
const router = Router();

router.post("/verify", verifyOTPController);
router.post("/resend", resendOTP);

export default router;
