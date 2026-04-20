import { createIncidentReport, getFeed, getMapResources, getReviewQueue, reviewIncidentReport } from "../services/reportService.js";

export async function listReports(req, res, next) {
  try {
    const data = await getFeed({ status: req.query.status });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createReport(req, res, next) {
  try {
    const { zone, text } = req.body;

    if (!zone || !text) {
      return res.status(400).json({
        success: false,
        message: "Zone and description are required.",
      });
    }

    const data = await createIncidentReport({
      body: req.body,
      file: req.file,
      user: req.user,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function listResources(req, res, next) {
  try {
    const data = await getMapResources();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listReviewQueue(req, res, next) {
  try {
    const data = await getReviewQueue();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reviewReport(req, res, next) {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "A review status is required.",
      });
    }

    const data = await reviewIncidentReport({
      reportId: req.params.reportId,
      status,
      notes,
      reviewer: req.user,
    });

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}
