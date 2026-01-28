import { runBatch } from '../jobService.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { so_luong } = req.body

  if (!so_luong || so_luong <= 0) {
    return res.status(400).json({ error: 'Số lượng không hợp lệ' })
  }

  const total = await runBatch(so_luong)

  res.json({
    success: true,
    total
  })
}
