import { User } from "../models/User.js";
import { databaseState } from "../db/state.js";
import {
  countUsers as countMemoryUsers,
  createUser as createMemoryUser,
  findUserByEmail as findMemoryUserByEmail,
  findUserById as findMemoryUserById,
} from "../db/memoryStore.js";

export async function findUserByEmail(email) {
  if (databaseState.connected) {
    return User.findOne({ email });
  }

  return findMemoryUserByEmail(email);
}

export async function countUsers() {
  if (databaseState.connected) {
    return User.countDocuments();
  }

  return countMemoryUsers();
}

export async function createUser(user) {
  if (databaseState.connected) {
    return User.create(user);
  }

  return createMemoryUser(user);
}

export async function findUserById(id) {
  if (databaseState.connected) {
    return User.findById(id);
  }

  return findMemoryUserById(id);
}
