import fs from "fs";
import path from "path";
import multer from "multer";
import { config } from "../config/env.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, config.uploadDir);
  },
  filename(req, file, callback) {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeName}`);
  },
});

function fileFilter(req, file, callback) {
  if (!file.mimetype.startsWith("image/")) {
    return callback(new Error("Only image uploads are allowed."), false);
  }

  return callback(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
