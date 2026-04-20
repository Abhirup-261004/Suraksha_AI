import "dotenv/config";
import path from "path";

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : defaultOrigins;

function resolveUploadDir(uploadDir) {
  if (!uploadDir || uploadDir.includes("/absolute/path/to/")) {
    return path.resolve(process.cwd(), "uploads");
  }

  return path.isAbsolute(uploadDir) ? uploadDir : path.resolve(process.cwd(), uploadDir);
}

export const config = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || "127.0.0.1",
  clientOrigin: allowedOrigins,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/suraksha_ai",
  jwtSecret: process.env.JWT_SECRET || "suraksha-ai-dev-secret",
  uploadDir: resolveUploadDir(process.env.UPLOAD_DIR),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiVisionModel: process.env.OPENAI_VISION_MODEL || "gpt-5.4-mini",
  defaultMapLat: Number(process.env.DEFAULT_MAP_LAT || 22.5726),
  defaultMapLng: Number(process.env.DEFAULT_MAP_LNG || 88.3639),
};
