import fetch from "node-fetch";

/**
 * Cấu hình APP LARK – BẢNG JOB
 * (lấy từ Environment Variables trên Vercel)
 */
const JOB_APP = {
  APP_ID: process.env.JOB_LARK_APP_ID,
  APP_SECRET: process.env.JOB_LARK_APP_SECRET,
  BASE_ID: process.env.JOB_BASE_ID,
  TABLE_ID: process.env.JOB_TABLE_ID,
};

/**
 * Lấy tenant_access_token từ Lark
 */
async function getTenantToken() {
  const res = await fetch(
    "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: JOB_APP.APP_ID,
        app_secret: JOB_APP.APP_SECRET,
      }),
    }
  );

  const data = await res.json();

  if (!data.tenant_access_token) {
    throw new Error("Không lấy được tenant_access_token từ Lark");
  }

  return data.tenant_access_token;
}

/**
 * Lấy danh sách job hợp lệ để tạo video
 * - Chưa tick "Đã làm video"
 * - Nhóm việc: POD | POD/Dropship | Dropship
 * - Ưu tiên Trạng thái = "Đang tuyển"
 */
export async function getValidJobs(limit = 5) {
  const token = await getTenantToken();

  const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${JOB_APP.BASE_ID}/tables/${JOB_APP.TABLE_ID}/records?page_size=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  const records = data?.data?.items || [];

  const VALID_GROUPS = ["POD", "POD/Dropship", "Dropship"];

  // === MAP + FILTER ===
  const jobs = records
    .map((r) => {
      const f = r.fields || {};

      return {
        // dữ liệu chính
        record_id: r.record_id,
        cong_viec: f["Công việc"] || null,
        cong_ty: f["Công ty"] || null,
        thanh_pho: f["Thành phố"] || null,
        quan: f["Quận"] || null,
        dia_chi: f["Địa chỉ"] || null,
        thoi_gian_lam_viec: f["Thời gian làm việc"] || null,
        luong_min: f["Lương tối thiểu"] || null,
        luong_max: f["Lương tối đa"] || null,
        kinh_nghiem: f["Kinh nghiệm"] || null,
        link_jd: f["Link JD"] || null,

        // dùng để lọc
        nhom_viec: f["Nhóm việc"] || null,
        trang_thai: f["Trạng thái"] || null,
        da_lam_video: f["Đã làm video"] === true,
      };
    })
    .filter((job) => {
      if (job.da_lam_video) return false;
      if (!VALID_GROUPS.includes(job.nhom_viec)) return false;
      return true;
    });

  // === ƯU TIÊN ĐANG TUYỂN ===
  const uuTien = jobs.filter((j) => j.trang_thai === "Đang tuyển");
  const conLai = jobs.filter((j) => j.trang_thai !== "Đang tuyển");

  return [...uuTien, ...conLai].slice(0, limit);
}
