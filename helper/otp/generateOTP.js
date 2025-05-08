const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
  const create_at_otp = new Date();
  return { otp, create_at_otp };
};

export default generateOTP;