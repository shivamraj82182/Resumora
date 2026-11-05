function parseProjectUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim().replace(/[.,;!?]+$/, "");
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return null;
    }

    const searchHosts = new Set([
      "google.com",
      "www.google.com",
      "bing.com",
      "www.bing.com",
      "search.yahoo.com",
      "duckduckgo.com",
      "www.duckduckgo.com",
    ]);
    if (
      searchHosts.has(hostname) &&
      (url.pathname.toLowerCase().includes("search") || url.searchParams.has("q"))
    ) {
      return null;
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    return {
      key: `${url.protocol}//${url.host.toLowerCase()}${pathname}${url.search}${url.hash}`,
      value: candidate,
    };
  } catch {
    return null;
  }
}

export function projectUrls(project, basics = {}) {
  const contactUrls = new Set(
    (basics.links || [])
      .map((link) => parseProjectUrl(link.url)?.key)
      .filter(Boolean),
  );
  const candidates = [
    project?.link,
    ...(project?.links || []).map((link) => link.url),
  ];
  const seen = new Set();

  return candidates.flatMap((candidate) => {
    const parsed = parseProjectUrl(candidate);
    if (!parsed || contactUrls.has(parsed.key) || seen.has(parsed.key)) return [];
    seen.add(parsed.key);
    return [parsed.value];
  });
}