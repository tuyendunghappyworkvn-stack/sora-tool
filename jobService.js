import fetch from "node-fetch";
import { JOB_APP } from "./config.js";

/**
 * Lấy access token cho app Lark
 */
async function getTenantToken() {
  const res = await fetch("https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: JOB_APP.APP_ID,
      app_secret: JOB_APP.APP_SECRET
    })
  });

  const data = await res.json();
  if (!data.tenant_access_token) {
    throw new Error("Không lấy được tenant_access_token");
  }
  return data.tenant_access_token;
}

/**
 * Lấy danh sách job hợp lệ
 */
export async function getValidJobs(limit = 5) {
  const token = await getTenantToken();

  const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${JOB_APP.BASE_ID}/tables/${JOB_APP.TABLE_ID}/records?page_size=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  const records = data.data?.items || [];

  // ==== LỌC JOB ====
  const VALID_GROUPS = ["POD", "POD/Dropship", "Dropship"];

  const jobs = records
    .map(r => ({
      record_id: r.record_id,
      ...r.fields
    }))
    .filter(job => {
      const daLamVideo = job["Đã làm video"];
      const nhomViec = job["Nhóm việc"];
      const trangThai = job["Trạng thái"];

      if (daLamVideo === true) return false;
      if (!VALID_GROUPS.includes(nhomViec)) return false;

      return true;
    });

  // Ưu tiên Đang tuyển
  const uuTien = jobs.filter(j => j["Trạng thái"] === "Đang tuyển");
  const conLai = jobs.filter(j => j["Trạng thái"] !== "Đang tuyển");

  const ketQua = [...uuTien, ...conLai].slice(0, limit);

  return ketQua;
}
