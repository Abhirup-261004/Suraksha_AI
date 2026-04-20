import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { countUsers, createUser, findUserByEmail } from "../repositories/userRepository.js";

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const userCount = await countUsers();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    role: userCount === 0 ? "admin" : "responder",
  });

  return {
    token: createToken(user),
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  return {
    token: createToken(user),
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
