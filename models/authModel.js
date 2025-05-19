import Account from "./model_database/accounts.js";
import bcrypt from "bcryptjs";
import User from "./model_database/users.js";
import updateDeviceID from "./updateDeviceID.js";

const registerModel = async (username, email, contactNumber, password) => {
  const existingAccount = await Account.findOne({ email });

  if (existingAccount) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name: username,
    avatar: "",
  });
  const savedUser = await newUser.save();

  const newAccount = new Account({
    email,
    contactNumber,
    password: hashedPassword,
    user_id: savedUser._id,
  });

  await newAccount.save();

  return { newAccount, newUser };
};

const loginModel = async (accountName, password, type, deviceID) => {
  console.log("accountName", accountName, password, type, deviceID);
  const query =
    type === "E"
      ? { email: { $eq: accountName } }
      : { contactNumber: { $eq: accountName } };
  const account = await Account.findOne(query);

  if (!account) {
    throw new Error("Account not found");
  }
  const isMatchPassword = await bcrypt.compare(password, account.password);

  const verifyMail = account.verifyMail;
  console.log("verifyMail", account.deviceID);
  let isMatchDeviceID =
    account.deviceID != ""
      ? account.deviceID === deviceID
      : (updateDeviceID(account.email, deviceID), true);

  if (!isMatchPassword) {
    throw new Error("Invalid password");
  }

  let user = null;
  if (account && isMatchPassword && verifyMail) {
    user = await User.findById(account.user_id);
    if (!user) {
      throw new Error("User not found");
    }
  }
  return { account, verifyMail, email: account.email, user, isMatchDeviceID };
};

const resetPasswordModel = async (email, password) => {
  const account = await Account.findOne({ email });
  if (!account) {
    throw new Error("Account not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  account.password = hashedPassword;

  await account.save();

  return account;
};

export { registerModel, loginModel, resetPasswordModel };
