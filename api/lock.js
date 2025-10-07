import { requireAdminHeader, lock } from "./_lib/ttlock.js";

export default async function handler(req, res) {
	if (!requireAdminHeader(req, res)) return;
	if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
	try {
		const id = Number((req.body && req.body.lockId) || process.env.LOCK_ID);
		if (!id) return res.status(400).json({ error: "lockId required" });
		const resp = await lock(id);
		res.status(200).json(resp);
	} catch (e) {
		res.status(500).json({ error: e.message || "lock failed" });
	}
}
