import { requireAdminHeader, openState, lock, unlock } from "./_lib/ttlock.js";

export default async function handler(req, res) {
	if (!requireAdminHeader(req, res)) return;
	if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
	try {
		const id = Number((req.body && req.body.lockId) || process.env.LOCK_ID);
		if (!id) return res.status(400).json({ error: "lockId required" });
		const s = await openState(id);
		const resp = s.state === 1 ? await lock(id) : await unlock(id);
		res.status(200).json({ prevState: s.state, ...resp });
	} catch (e) {
		res.status(500).json({ error: e.message || "toggle failed" });
	}
}
