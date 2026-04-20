import { loginUser, registerUser } from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const data = await registerUser({ name, email, password });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const data = await loginUser({ email, password });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  res.json({
    success: true,
    data: req.user,
  });
}
