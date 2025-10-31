

export interface PickMatch {
  date_time: string;
  league: string;
  home: string;
  away: string;
  home_logo: string;
  away_logo: string;
  win_pick: string;
  win_percent: string;
  btts_pick: string;
  btts_percent: string;
  cs_pick: string;
  cs_percent: string;
  ou_2_5_pick: string;
  ou_2_5_percent: string;
  ou_3_5_pick: string;
  ou_3_5_percent: string;
}

export interface PicksResponse {
  success: boolean;
  count: number;
  matches: PickMatch[];
}