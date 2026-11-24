export interface SearchResult { title: string; url: string; content: string }

export async function tavilySearch(query: string, maxResults = 6): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY missing");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: maxResults, topic: "general" }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { results?: SearchResult[] };
  return (json.results ?? []).map((r) => ({ title: r.title, url: r.url, content: (r.content ?? "").slice(0, 700) }));
}
