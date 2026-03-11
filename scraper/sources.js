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
    name: "On3 College Sports",
    url: "https://www.on3.com/feed/",
    topics: ["NIL", "TRANSFER_PORTAL", "RECRUITING"]
  },
  {
    name: "247Sports College Sports",
    url: "https://247sports.com/Page/College-Sports-News-and-Recruiting-100021/Feeds/",
    topics: ["TRANSFER_PORTAL", "RECRUITING", "CFB"]
  },
  {
    name: "Yahoo CFB",
    url: "https://sports.yahoo.com/college-football/rss.xml",
    topics: ["CFB", "NIL", "REALIGNMENT"]
  },
  {
    name: "The Spun CFB",
    url: "https://thespun.com/.rss/full/college-football/",
    topics: ["CFB", "GENERAL"]
  },
  {
    name: "AP News CFB",
    url: "https://apnews.com/hub/college-football.rss",
    topics: ["CFB", "NIL", "REALIGNMENT", "LEGAL"]
  },

  // --- SCHOOL SPECIFIC (via AP News + USA Today wire feeds) ---
  {
    name: "AP News Oklahoma Sooners",
    url: "https://apnews.com/hub/oklahoma-sooners.rss",
    school: "OU",
    topics: ["CFB", "OU"]
  },
  {
    name: "Sooners Wire",
    url: "https://soonerswire.usatoday.com/feed/",
    school: "OU",
    topics: ["CFB", "OU", "NIL"]
  },
  {
    name: "Cowboys Wire",
    url: "https://cowboyswire.usatoday.com/feed/",
    school: "OSU",
    topics: ["CFB", "OSU", "NIL"]
  },
  {
    name: "Longhorns Wire",
    url: "https://longhornswire.usatoday.com/feed/",
    school: "TEXAS",
    topics: ["CFB", "TEXAS", "NIL"]
  },
  {
    name: "AP News Texas Longhorns",
    url: "https://apnews.com/hub/texas-longhorns.rss",
    school: "TEXAS",
    topics: ["CFB", "TEXAS"]
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
