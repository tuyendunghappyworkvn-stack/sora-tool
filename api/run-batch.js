import { getValidJobs } from "../jobService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { so_luong } = req.body;

    const limit = Number(so_luong || 1);
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ error: "Số lượng không hợp lệ" });
    }

    const jobs = await getValidJobs(limit);

    console.log("JOB ĐƯỢC LẤY:", jobs);

    return res.status(200).json({
      success: true,
      total: jobs.length,
      jobs
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
