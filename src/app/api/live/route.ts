import { NextResponse } from "next/server";
import { findTeamMatch, findLeagueMatch, calculateSimilarity } from "@/lib/teamMatching";

const RESULT_PARENT_URL = "https://sport.ibet288.com/_view/Result.aspx";
const BASE_URL = "https://json.vnres.co";

interface IbetResult {
  league: string;
  home: string;
  away: string;
  ft: string | null;
  ht: string | null;
}

interface VnresMatch {
  matchTime: number;
  subCateName: string;
  hostName: string;
  hostIcon: string;
  guestName: string;
  guestIcon: string;
  homeScore?: number;
  awayScore?: number;
  anchors: { anchor: { roomNum: number } }[];
}

interface ServerStream {
  name: "480p" | "1080p";
  stream_url: string;
}

interface Match {
  match_time: string;
  match_status: "live" | "finished" | "vs";
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  match_score: string | null;
  ht_score: string | null;
  servers: ServerStream[];
  debug?: {
    original_league: string;
    original_home: string;
    original_away: string;
    ibet_match: "FOUND" | "NOT_FOUND";
  };
}

// --- Cache Layer ---
interface CachedIbet {
  timestamp: number;
  data: IbetResult[];
}
let ibetCache: CachedIbet | null = null;

interface CachedMatch {
  timestamp: number;
  data: Match[];
}
const matchCache: Record<string, CachedMatch> = {};

// --- API Handler ---
export async function GET() {
  try {
    const dates = [
      formatDate(Date.now()),
      formatDate(Date.now() + 72_000_000), // 20 hours ahead
    ];

    const ibetResults = await getCachedIbetResults();
    const matchGroups = await Promise.all(
      dates.map((d) => fetchMatches(d, ibetResults))
    );

    const allMatches = matchGroups.flat();

    return NextResponse.json(allMatches, {
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: unknown) {
    console.error("[API] Live fetch error:", err);
    return NextResponse.json(
      { error: "Server error", message: (err as Error).message },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
}

// --- Helpers ---
function formatDate(ms: number): string {
  const dt = new Date(ms);
  const formatted = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(dt);
  return formatted.replace(/-/g, "");
}

// --- iBet Fetch + Cache ---
async function getCachedIbetResults(): Promise<IbetResult[]> {
  const now = Date.now();
  if (ibetCache && now - ibetCache.timestamp < 3 * 60 * 1000) {
    return ibetCache.data;
  }
  
  try {
    const results = await fetchIbetResults();
    ibetCache = { timestamp: now, data: results };
    return results;
  } catch (error) {
    console.warn("⚠️ iBet fetch failed, using cache if available:", error);
    return ibetCache?.data || [];
  }
}

async function fetchIbetResults(): Promise<IbetResult[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(RESULT_PARENT_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.google.com/",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const tableMatch = html.match(/<table[^>]*id="g1"[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return [];

    const rows = tableMatch[1].split(/<\/tr>/i);
    let currentLeague = "";
    const scores: IbetResult[] = [];

    for (const row of rows) {
      if (/class="?Event"?/i.test(row)) {
        const league = row.replace(/<[^>]+>/g, "").trim();
        if (league) currentLeague = league;
      } else if (/class="?Normal"?/i.test(row)) {
        const cols = row.split(/<\/td>/i).map((c) => c.replace(/<[^>]+>/g, "").trim());
        if (cols.length >= 5 && cols[1] && cols[3]) {
          scores.push({
            league: applyAliases(currentLeague),
            home: applyAliases(cols[1]),
            away: applyAliases(cols[3]),
            ft: cols[2] || null,
            ht: cols[4] || null,
          });
        }
      }
    }

    return scores;
  } catch (err: unknown) {
    console.warn("⚠️ iBet fetch failed:", (err as Error).message);
    return [];
  }
}

// --- VNRes Fetch + Cache ---
async function fetchMatches(date: string, ibetResults: IbetResult[]): Promise<Match[]> {
  const cached = matchCache[date];
  if (cached && Date.now() - cached.timestamp < 120_000) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${BASE_URL}/match/matches_${date}.json`, {
      headers: { 
        referer: "https://socolivev.co/", 
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        origin: BASE_URL 
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const txt = await res.text();
    const m = txt.match(/matches_\d+\((.*)\)/);
    if (!m) return [];

    const js: { code: number; data: VnresMatch[] } = JSON.parse(m[1]);
    if (js.code !== 200) return [];

    const now = Math.floor(Date.now() / 1000);
    const results: Match[] = await Promise.all(
      js.data.map(async (it) => {
        const mt = Math.floor(it.matchTime / 1000);
        const status: Match["match_status"] =
          now >= mt && now <= mt + 7200 ? "live" : now > mt + 7200 ? "finished" : "vs";

        const ibet = findIbetScore(ibetResults, it.subCateName, it.hostName, it.guestName);
        const match_score =
          ibet.ft && ibet.ft !== "-"
            ? ibet.ft
            : it.homeScore != null && it.awayScore != null
            ? `${it.homeScore} - ${it.awayScore}`
            : null;
        const ht_score = ibet.ht && ibet.ht !== "-" ? ibet.ht : null;

        const servers = status === "live" ? await fetchAllServerURLs(it.anchors) : [];

        // Fixed: Explicitly type the ibet_match value
        const ibetMatchStatus: "FOUND" | "NOT_FOUND" = ibet.ft || ibet.ht ? "FOUND" : "NOT_FOUND";

        return {
          match_time: formatMatchTime(mt),
          match_status: status,
          home_team_name: it.hostName,
          home_team_logo: it.hostIcon,
          away_team_name: it.guestName,
          away_team_logo: it.guestIcon,
          league_name: it.subCateName,
          match_score,
          ht_score,
          servers,
          debug: {
            original_league: it.subCateName,
            original_home: it.hostName,
            original_away: it.guestName,
            ibet_match: ibetMatchStatus,
          },
        };
      })
    );

    matchCache[date] = { timestamp: Date.now(), data: results };
    return results;
  } catch (err: unknown) {
    console.warn(`⚠️ VNRes ${date} error:`, (err as Error).message);
    return matchCache[date]?.data || [];
  }
}

// --- Fetch Servers ---
async function fetchAllServerURLs(anchors: { anchor: { roomNum: number } }[]): Promise<ServerStream[]> {
  const results: ServerStream[] = [];
  
  if (!anchors || anchors.length === 0) {
    return results;
  }

  await Promise.allSettled(
    anchors.map(async (a) => {
      if (!a.anchor?.roomNum) return;
      
      try {
        const s = await fetchServerURL(a.anchor.roomNum);
        if (s.m3u8) results.push({ name: "480p", stream_url: s.m3u8 });
        if (s.hdM3u8) results.push({ name: "1080p", stream_url: s.hdM3u8 });
      } catch (error) {
        console.warn(`Failed to fetch server URL for room ${a.anchor.roomNum}:`, error);
      }
    })
  );
  
  return results;
}

async function fetchServerURL(roomNum: number): Promise<{ m3u8: string | null; hdM3u8: string | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://json.vnres.co/room/${roomNum}/detail.json`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://socolivev.co/",
        "Origin": "https://socolivev.co",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const txt = await res.text();
    const m = txt.match(/detail\((.*)\)/);
    if (!m) return { m3u8: null, hdM3u8: null };
    
    const js = JSON.parse(m[1]);
    return { 
      m3u8: js.data?.stream?.m3u8 ?? null, 
      hdM3u8: js.data?.stream?.hdM3u8 ?? null 
    };
  } catch {
    return { m3u8: null, hdM3u8: null };
  }
}

// --- Utilities ---
function formatMatchTime(unixSeconds: number): string {
  const dt = new Date(unixSeconds * 1000);
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yangon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
  return formatted;
}

function normalizeName(s: string): string {
  return (s || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

const ALIASES: Record<string, string> = {
  sg: "super giant",
  acl2: "afc champions league 2",
  utd: "united",
  mun: "manchester united",
};

function applyAliases(raw: string): string {
  return normalizeName(raw)
    .split(" ")
    .map((w) => ALIASES[w] ?? w)
    .join(" ");
}

function findIbetScore(
  ibetResults: IbetResult[],
  league: string,
  home: string,
  away: string
): { ft: string | null; ht: string | null } {
  if (!ibetResults || ibetResults.length === 0) {
    return { ft: null, ht: null };
  }

  const aLeague = applyAliases(findLeagueMatch(league));
  const aHome = applyAliases(findTeamMatch(home));
  const aAway = applyAliases(findTeamMatch(away));

  let best: IbetResult | null = null;
  let bestScore = 0;

  for (const row of ibetResults) {
    const score =
      calculateSimilarity(aLeague, row.league) +
      calculateSimilarity(aHome, row.home) +
      calculateSimilarity(aAway, row.away);

    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }

  return best && bestScore >= 0.6 ? { ft: best.ft, ht: best.ht } : { ft: null, ht: null };
}

export const dynamic = 'force-dynamic';