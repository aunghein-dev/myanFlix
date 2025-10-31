
// --- Types ---
export interface IbetResult {
  league: string;
  home: string;
  away: string;
  ft: string | null;
  ht: string | null;
}

export interface VnresMatch {
  matchTime: number;
  subCateName: string;
  hostName: string;
  hostIcon: string;
  guestName: string;
  guestIcon: string;
  homeScore?: number;
  awayScore?: number;
}

export interface Match {
  match_time: string;
  match_status: "live" | "finished" | "vs";
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  match_score: string | null;
  ht_score: string | null;
  debug: {
    original_league: string;
    original_home: string;
    original_away: string;
    ibet_match: "FOUND" | "NOT_FOUND";
  };
}


export interface ServerStream {
  name: "480p" | "1080p";
  stream_url: string;
}