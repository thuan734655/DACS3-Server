import sendOTP from "../helper/otp/sendOTP.js";

const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    sendOTP(email, false);
    
    res.status(200).json({
      message: "OTP has been resent to your email",
      action: "enter_otp",
      data: { email },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default resendOTP;
