import { getDashboardSnapshot } from "../services/reportService.js";

export async function getDashboard(req, res, next) {
  try {
    const data = await getDashboardSnapshot();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
