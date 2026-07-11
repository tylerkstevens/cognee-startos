import type { NextApiRequest, NextApiResponse } from "next";

const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://cognee.embassy:8000";

// Proxy any Cognee backend path.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pathParts = req.query.path as string[] | string | undefined;
  const resolvedPath = Array.isArray(pathParts) ? pathParts.join("/") : pathParts || "";
  const query = new URLSearchParams(req.query as Record<string, string>);
  // Remove the Next.js internal `path` param before forwarding.
  query.delete("path");

  const targetUrl = `${localApiUrl}/api/v1/${resolvedPath}${query.toString() ? `?${query.toString()}` : ""}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...(req.headers as Record<string, string>),
        // Strip the original Host so the backend sees its own internal host.
        // This avoids confusing upstream if it validates Host headers.
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
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
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Bad Gateway", message: String(err) });
  }
}
