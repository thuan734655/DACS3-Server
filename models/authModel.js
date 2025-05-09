import Account from "./model_database/accounts.js";
import bcrypt from "bcryptjs";
import User from "./model_database/users.js";

const registerModel = async (username, email, contactNumber, password) => {
  const existingAccount = await Account.findOne({ username });

  if (existingAccount) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newAccount = new Account({
    email,
    contactNumber,
    password: hashedPassword,
    username,
  });

  await newAccount.save();

  const newUser = new User({
    name: username,
    avatar: "",
  });

  await newUser.save();

  return newAccount;
};

const loginModel = async (accountName, password, type, deviceID) => {
  const query =
    type === "E"
      ? { email: { $eq: accountName } }
      : { contactNumber: { $eq: accountName } };
  const account = await Account.findOne(query);
  if (!account) {
    throw new Error("Invalid username or password");
  }

  const isMatchPassword = await bcrypt.compare(password, account.password);

  const verifyMail = account.verifyMail;

  if (!isMatchPassword) {
    throw new Error("Invali password");
  }
  return { account, verifyMail, email: account.email };
};

export { registerModel, loginModel };
