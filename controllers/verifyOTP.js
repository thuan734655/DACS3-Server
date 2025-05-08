import verifyOTPModel from "../models/verifyOTP.js";

const verifyOTPController = async (req, res) => {
  const { email, otp, deviceID } = req.body;
  try {
    const { isEffectiveOTP, isMatchOTP } = await verifyOTPModel(
      email,
      otp,
      deviceID
    );
    if (!isEffectiveOTP) {
      return res.status(400).json({
        message: "OTP has expired",
        action: "get_new_otp",
        data: { email },
      });
    }
    if (!isMatchOTP) {
      return res.status(401).json({
        message: "Invalid OTP",
        action: "re-enter_otp",
        data: { email },
      });
    }
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default verifyOTPController;
