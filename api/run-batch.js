import { getValidJobs } from "../jobService.js";

/**
 * Build prompt cho 1 job
 */
function buildPrompt(job) {
  return `
Tạo video tuyển dụng phong cách TikTok, thời lượng 15–20 giây.

Thông tin công việc:
- Vị trí: ${job.cong_viec}
- Công ty: ${job.cong_ty}
- Địa điểm: ${job.quan}, ${job.thanh_pho}
- Mức lương: ${job.luong_min} – ${job.luong_max}
- Kinh nghiệm: ${job.kinh_nghiem}

Yêu cầu video:
- Tỷ lệ 9:16
- Phong cách trẻ trung, hiện đại
- Text overlay rõ ràng, dễ đọc
- Không cần giọng đọc
- Nhạc nền năng động
- Kết thúc với CTA: Ứng tuyển ngay

Ngôn ngữ: Tiếng Việt
`;
}

export default async function handler(req, res) {
  try {
    const soLuong = Number(req.query.so_luong || 1);

    if (!soLuong || soLuong <= 0) {
      return res.status(400).json({ error: "Số lượng không hợp lệ" });
    }

    const jobs = await getValidJobs(soLuong);

    if (!jobs.length) {
      return res.json({
        success: true,
        message: "Không có job hợp lệ",
        prompts: []
      });
    }

    // 🔥 TEST: chỉ build prompt, CHƯA gọi Sora
    const prompts = jobs.map(job => ({
      record_id: job.record_id,
      prompt: buildPrompt(job)
    }));

    return res.json({
      success: true,
      total: prompts.length,
      prompts
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message || "Server error"
    });
  }
}
