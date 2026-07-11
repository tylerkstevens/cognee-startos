import type { NextApiRequest, NextApiResponse } from "next";

const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://cognee.embassy:8000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const upstreamRes = await fetch(`${localApiUrl}/health`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
    });

    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, key) => {
      if (["transfer-encoding", "content-encoding", "content-length", "connection"].includes(key.toLowerCase())) {
        return;
      }
      res.setHeader(key, value);
    });

    const body = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (err) {
    console.error("Health proxy error:", err);
    res.status(502).json({ error: "Bad Gateway", message: String(err) });
  }
}
