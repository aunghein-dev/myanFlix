import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { PickMatch } from "@/types/matchpick";

const TARGET_URL = "https://mygameodds.com/picks-of-the-day/";

// --- Helpers ---
function cleanText(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

function formatDateAMPM(dateStr: string, timeStr: string): string {
  const parsed = new Date(`${dateStr} ${timeStr} UTC`);
  return parsed.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}


export async function GET() {
  try {
    const res = await fetch(TARGET_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      cache: "no-store",
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const predictionButtons = $("div.predictionsCard_Accordion__mobile__JHt0E button");

    const matches: PickMatch[] = predictionButtons.map((_, el) => {
      const $el = $(el);

      let date = "";
      let time = "";
      const dateContainer = $el.find(".flex.items-center.py-3.pr-3.text-sm.font-medium.text-left");

      dateContainer.find(".grid.grid-cols-1.gap-1 .text-xs.font-medium.text-left").each((i, elem) => {
        const t = cleanText($(elem).text());
        if (i === 0) date = t;
        if (i === 1) time = t;
      });

      if (!date || !time) {
        const altTexts = dateContainer.find(".whitespace-nowrap");
        date = cleanText(altTexts.eq(0).text());
        time = cleanText(altTexts.eq(1).text());
      }

      const date_time = formatDateAMPM(date, time);

      const leagueRaw = cleanText($el.find(".accordionTitle_Winner__o7ogA a").first().text());
      const league = leagueRaw;

      const imgs = $el.find("img");
      const home = imgs.eq(0).attr("alt")?.replace(" logo", "") || "";
      const away = imgs.eq(1).attr("alt")?.replace(" logo", "") || "";
      const home_logo = imgs.eq(0).attr("src") || "";
      const away_logo = imgs.eq(1).attr("src") || "";


      const values = $el.find(".predictionsCard_Winner__YwpME");

      function getPick(index: number) {
        const pick = cleanText(values.eq(index).text());
        const percent = cleanText(values.eq(index).parent().find("span").eq(2).text());
        return [pick, percent] as const;
      }

      const [win_pick, win_percent] = getPick(0);
      const [btts_pick, btts_percent] = getPick(1);
      const [cs_pick, cs_percent] = getPick(2);
      const [ou_2_5_pick, ou_2_5_percent] = getPick(3);
      const [ou_3_5_pick, ou_3_5_percent] = getPick(4);

      return {
        date_time,
        league,
        home,
        away,
        home_logo,
        away_logo,
        win_pick,
        win_percent,
        btts_pick,
        btts_percent,
        cs_pick,
        cs_percent,
        ou_2_5_pick,
        ou_2_5_percent,
        ou_3_5_pick,
        ou_3_5_percent,
      };
    }).get();

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err: unknown) {
    console.error("Scrape error:", err);
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    });
  }
}
