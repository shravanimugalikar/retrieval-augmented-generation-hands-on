import bcrypt from "bcrypt";
import { User } from "./user.model";
import { generateToken } from "../../utils/jwt";

export const registerUser = async (
  email: string,
  password: string
) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const user = await User.create({
    email,
    password: hashedPassword,
  });

  const token = generateToken(
    user._id.toString()
  );

  return {
    user,
    token,
  };
};