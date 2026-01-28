import fetch from 'node-fetch'
import { JOB_APP, VIDEO_APP } from './config.js'

// ===== TOKEN =====
async function getToken(app) {
  const res = await fetch(
    'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: app.APP_ID,
        app_secret: app.APP_SECRET
      })
    }
  )
  const data = await res.json()
  return data.tenant_access_token
}

// ===== QUERY JOB =====
async function queryJobs(token, filter, limit) {
  const url =
    `https://open.larksuite.com/open-apis/bitable/v1/apps/${JOB_APP.BASE_ID}` +
    `/tables/${JOB_APP.TABLE_ID}/records?filter=${encodeURIComponent(filter)}&page_size=${limit}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const data = await res.json()
  return data.data?.items || []
}

// ===== CREATE VIDEO =====
async function createVideo(token, fields) {
  return fetch(
    `https://open.larksuite.com/open-apis/bitable/v1/apps/${VIDEO_APP.BASE_ID}` +
      `/tables/${VIDEO_APP.TABLE_ID}/records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    }
  )
}

// ===== UPDATE JOB =====
async function updateJob(token, recordId) {
  return fetch(
    `https://open.larksuite.com/open-apis/bitable/v1/apps/${JOB_APP.BASE_ID}` +
      `/tables/${JOB_APP.TABLE_ID}/records/${recordId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { 'Đã làm video': true }
      })
    }
  )
}

// ===== MAIN SERVICE =====
export async function runBatch(soLuong) {
  const jobToken = await getToken(JOB_APP)
  const videoToken = await getToken(VIDEO_APP)

  const filter = `
    Đã làm video = false
    AND (
      Nhóm việc = "POD"
      OR Nhóm việc = "POD/Dropship"
      OR Nhóm việc = "Dropship"
    )
  `

  const jobs = await queryJobs(jobToken, filter, soLuong)

  for (const job of jobs) {
    const f = job.fields

    await createVideo(videoToken, {
      'Mã': f['Mã'],
      'Công ty': f['Công ty'],
      'Công việc': f['Công việc'],
      'Link JD': f['Link JD']
    })

    await updateJob(jobToken, job.record_id)
  }

  return jobs.length
}
