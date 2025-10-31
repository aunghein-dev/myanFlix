// Team name normalization and matching utilities

export interface TeamAlias {
  primary: string;
  aliases: string[];
}

export const TEAM_ALIASES: TeamAlias[] = [
  // AFC Champions League Teams
  { primary: "Gangwon FC", aliases: ["gangwon"] },
  { primary: "Vissel Kobe", aliases: ["vissel kobe"] },
  { primary: "Shanghai Shenhua FC", aliases: ["shanghai shenhua"] },
  { primary: "FC Seoul", aliases: ["fc seoul", "seoul"] },
  { primary: "Gamba Osaka", aliases: ["gamba osaka"] },
  { primary: "Thep Xanh Nam Dinh FC", aliases: ["nam dinh fc", "thep xanh nam dinh"] },
  { primary: "Ratchaburi FC", aliases: ["ratchaburi"] },
  { primary: "Eastern", aliases: ["eastern"] },
  
  // UEFA Champions League Teams
  { primary: "Athletic Club", aliases: ["athletic bilbao", "bilbao"] },
  { primary: "Qarabag", aliases: ["qarabag fk", "fk qarabag"] },
  { primary: "Galatasaray", aliases: ["galatasaray"] },
  { primary: "Bodo Glimt", aliases: ["bodo glimt"] },
  { primary: "Chelsea", aliases: ["chelsea"] },
  { primary: "AFC Ajax", aliases: ["ajax", "afc ajax"] },
  { primary: "Eintracht Frankfurt", aliases: ["eintracht frankfurt"] },
  { primary: "Liverpool", aliases: ["liverpool"] },
  { primary: "AS Monaco", aliases: ["as monaco", "monaco"] },
  { primary: "Tottenham Hotspur", aliases: ["tottenham", "tottenham hotspur"] },
  { primary: "Atalanta", aliases: ["atalanta"] },
  { primary: "Slavia Praha", aliases: ["slavia praha"] },
  { primary: "Real Madrid", aliases: ["real madrid"] },
  { primary: "Juventus", aliases: ["juventus"] },
  { primary: "FC Bayern Munich", aliases: ["bayern munchen", "bayern munich", "fc bayern munich"] },
  { primary: "Club Brugge", aliases: ["club brugge"] },
  { primary: "Sporting CP", aliases: ["sporting lisbon", "sporting cp"] },
  { primary: "Marseille", aliases: ["marseille"] },

  // Other notable teams
  { primary: "Al Nassr FC", aliases: ["al nassr riyadh", "al nassr"] },
  { primary: "FC Goa", aliases: ["fc goa"] },
  { primary: "Esteghlal Tehran", aliases: ["esteghlal"] },
  { primary: "Al Wehdat", aliases: ["al wehdat amman"] },
  { primary: "Al-Ahli Doha", aliases: ["al ahli doha"] },
  { primary: "Arkadag FK", aliases: ["fk arkadag"] },
  { primary: "Persib Bandung", aliases: ["persib bandung"] },
  { primary: "Selangor FC", aliases: ["selangor"] },
  { primary: "BG Pathum United", aliases: ["bg pathum united"] },
  { primary: "Beijing Guoan FC", aliases: ["beijing guoan fc"] },
  { primary: "Pohang Steelers", aliases: ["pohang steelers"] },

  // Indonesian Teams
  { primary: "PSIM Yogyakarta", aliases: ["psim yogyakarta"] },
  { primary: "Dewa United FC", aliases: ["dewa united fc"] },

  // Add more teams as needed...
];

export const LEAGUE_MAPPINGS: Record<string, string[]> = {
  "ACL Elite": ["afc champions league elite", "acl elite"],
  "ACL2": ["afc champions league two", "acl2"],
  "UEFA CL": ["uefa champions league", "champions league"],
  "UEFA YL": ["uefa youth league"],
  "IDN D1": ["indonesia super league", "indonesia liga 1"],
  "TUR D1": ["turkey super league", "super lig"],
  "EGY D1": ["egypt premier league"],
  "FIN D1": ["finland veikkausliiga"],
  "RUS Cup": ["russia cup"],
  "NBA": ["nba"],
  "NBL": ["nbl"],
  "KBL": ["kbl"],
  "MPBL": ["mpbl"],
};

export function normalizeTeamName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLeagueName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findTeamMatch(teamName: string): string {
  const normalized = normalizeTeamName(teamName);
  
  for (const team of TEAM_ALIASES) {
    // Check primary name
    if (normalizeTeamName(team.primary) === normalized) {
      return team.primary;
    }
    
    // Check aliases
    for (const alias of team.aliases) {
      if (normalizeTeamName(alias) === normalized) {
        return team.primary;
      }
    }
  }
  
  return teamName; // Return original if no match found
}

export function findLeagueMatch(leagueName: string): string {
  const normalized = normalizeLeagueName(leagueName);
  
  for (const [key, aliases] of Object.entries(LEAGUE_MAPPINGS)) {
    if (aliases.some(alias => normalizeLeagueName(alias) === normalized)) {
      return key;
    }
  }
  
  return leagueName; // Return original if no match found
}

export function calculateSimilarity(a: string, b: string): number {
  const aNorm = normalizeTeamName(a);
  const bNorm = normalizeTeamName(b);
  
  if (aNorm === bNorm) return 1.0;
  
  const aWords = new Set(aNorm.split(' '));
  const bWords = new Set(bNorm.split(' '));
  
  let intersection = 0;
  for (const word of aWords) {
    if (bWords.has(word)) intersection++;
  }
  
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? intersection / union : 0;
}