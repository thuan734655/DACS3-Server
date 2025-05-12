import Account from "./model_database/accounts.js";

const updateStatusMail = async (email, satatus) => {
  console.log("email fsfds", email);
  const verifyMail = satatus;
  const updateVerifyMail = await Account.findOneAndUpdate(
    { email },
    { verifyMail },
    { new: true, runValidators: true }
  );
  if (!updateVerifyMail) {
    throw new Error("Email not found");
  }
  return updateVerifyMail;
};

export default updateStatusMail;
