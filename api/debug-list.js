import { requireAdminHeader, listLocks } from "./_lib/ttlock.js";

export default async function handler(req, res) {
	if (!requireAdminHeader(req, res)) return;
	if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
	try {
		const resp = await listLocks();
		res.status(200).json(resp);
	} catch (e) {
		res.status(500).json({ error: e.message || "list failed" });
	}
}
