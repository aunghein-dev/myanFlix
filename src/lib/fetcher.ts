export const fetcher = async (url: string) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};
