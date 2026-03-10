// sources.js - All scrape targets for XSEN news aggregator

export const RSS_FEEDS = [

  // --- NATIONAL CFB & NIL ---
  {
    name: "ESPN College Football",
    url: "https://www.espn.com/espn/rss/ncf/news",
    topics: ["CFB", "GENERAL"]
  },
  {
    name: "CBS Sports CFB",
    url: "https://www.cbssports.com/rss/headlines/college-football",
    topics: ["CFB", "GENERAL"]
  },
  {
    name: "On3 NIL",
    url: "https://www.on3.com/nil/feed/",
    topics: ["NIL", "TRANSFER_PORTAL"]
  },
  {
    name: "247Sports Transfer Portal",
    url: "https://247sports.com/Article/rss/?tag=Transfer-Portal",
    topics: ["TRANSFER_PORTAL"]
  },
  {
    name: "Sports Illustrated CFB",
    url: "https://www.si.com/rss/si_cfb.rss",
    topics: ["CFB", "NIL", "REALIGNMENT"]
  },

  // --- SCHOOL SPECIFIC ---
  {
    name: "OU Athletics",
    url: "https://soonersports.com/rss.aspx?path=football",
    school: "OU",
    topics: ["CFB", "OU"]
  },
  {
    name: "OSU Athletics",
    url: "https://okstate.com/rss.aspx?path=football",
    school: "OSU",
    topics: ["CFB", "OSU"]
  },
  {
    name: "Texas Athletics",
    url: "https://texassports.com/rss.aspx?path=football",
    school: "TEXAS",
    topics: ["CFB", "TEXAS"]
  },
  {
    name: "Texas Tech Athletics",
    url: "https://texastech.com/rss.aspx?path=football",
    school: "TEXAS_TECH",
    topics: ["CFB", "TEXAS_TECH", "NIL"]
  }
];

// Google News RSS searches - no API key needed
export const GOOGLE_NEWS_SEARCHES = [
  {
    query: "Smash Capital college football",
    topics: ["SMASH_CAPITAL", "PE_INVESTMENT"]
  },
  {
    query: "NIL collective college football 2025",
    topics: ["NIL"]
  },
  {
    query: "college football private equity investment",
    topics: ["PE_INVESTMENT", "REALIGNMENT"]
  },
  {
    query: "CFB transfer portal NIL deal",
    topics: ["NIL", "TRANSFER_PORTAL"]
  },
  {
    query: "House v NCAA settlement college football",
    topics: ["NIL", "LEGAL"]
  },
  {
    query: "Big 12 SEC conference realignment 2025",
    topics: ["REALIGNMENT"]
  },
  {
    query: "college football fan ownership collective",
    topics: ["NIL", "FAN_RIGHTS"]
  },
  {
    query: "Oklahoma Sooners NIL transfer portal",
    topics: ["NIL", "OU", "TRANSFER_PORTAL"]
  },
  {
    query: "Oklahoma State Cowboys NIL",
    topics: ["NIL", "OSU"]
  },
  {
    query: "Texas Longhorns NIL collective",
    topics: ["NIL", "TEXAS"]
  }
];

// School metadata for localization
export const SCHOOL_CONFIG = {
  OU: {
    name: "Oklahoma Sooners",
    conference: "SEC",
    fanbase: "Sooner Nation",
    rivalries: ["OSU", "TEXAS"],
    azuracast_playlist: process.env.AZURACAST_PLAYLIST_OU
  },
  OSU: {
    name: "Oklahoma State Cowboys",
    conference: "Big 12",
    fanbase: "Cowboy Nation",
    rivalries: ["OU"],
    azuracast_playlist: process.env.AZURACAST_PLAYLIST_OSU
  },
  TEXAS: {
    name: "Texas Longhorns",
    conference: "SEC",
    fanbase: "Longhorn Nation",
    rivalries: ["OU", "TEXAS_TECH"],
    azuracast_playlist: process.env.AZURACAST_PLAYLIST_TEXAS
  }
};

// Scoring keywords - Claude uses these as context
export const HIGH_VALUE_KEYWORDS = [
  "Smash Capital", "private equity", "PE firm", "college football ownership",
  "NIL collective", "fan collective", "booster collective",
  "House v NCAA", "revenue sharing", "athlete compensation",
  "transfer portal", "portal entry", "decommit",
  "conference realignment", "media rights", "broadcast deal",
  "fan rights", "fan ownership", "season ticket",
  "Big 12", "SEC expansion", "ACC", "Notre Dame independent"
];
