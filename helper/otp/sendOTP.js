import updateOTPModel from "../../models/updateOTP.js";
import sendMail from "../mail/sendMail.js";
import generateOTP from "./generateOTP.js";

const sendOTP = async (email) => {
  const { otp, create_at_otp } = generateOTP();
  await sendMail(
    email,
    "OTP for Account Verification",
    `Your OTP is ${otp}`,
    `<h1>Your OTP is ${otp}</h1>`
  );
  updateOTPModel(email, otp, create_at_otp);
};

export default sendOTP;
