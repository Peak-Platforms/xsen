// sources.js - XSEN News Sources
// RSS feeds + Google News queries for CFB coverage
// Set active: false to pause a source, active: true to enable

// ─── High Value Keywords (used by Claude scorer) ──────────────────────────────

export const HIGH_VALUE_KEYWORDS = [
  "Smash Capital", "private equity", "PE investment", "super league",
  "NIL collective", "transfer portal", "House settlement", "revenue sharing",
  "conference realignment", "fan rights", "collective bargaining",
  "athlete compensation", "name image likeness", "NCAA lawsuit"
];

// ─── RSS Feeds ────────────────────────────────────────────────────────────────

export const RSS_FEEDS = [
  // National CFB
  { url: 'https://www.espn.com/espn/rss/ncf/news',                        school: 'ALL_CFB', name: 'ESPN College Football',      active: true },
  { url: 'https://www.cbssports.com/rss/headlines/college-football',       school: 'ALL_CFB', name: 'CBS Sports CFB',              active: true },
  { url: 'https://www.on3.com/feed/',                                      school: 'ALL_CFB', name: 'On3 College Sports',          active: true },
  { url: 'https://sports.yahoo.com/college-football/rss.xml',              school: 'ALL_CFB', name: 'Yahoo CFB',                   active: true },
  { url: 'https://www.ncaa.com/sports/football/fbs/rss',                   school: 'ALL_CFB', name: 'NCAA.com FBS',                active: true },
  { url: 'https://www.foxsports.com/college-football/rss',                 school: 'ALL_CFB', name: 'Fox Sports CFB',              active: true },
  { url: 'https://fansided.com/college/mens-football/feed/',               school: 'ALL_CFB', name: 'FanSided CFB',                active: true },
  { url: 'https://thebiglead.com/college-football/feed/',                  school: 'ALL_CFB', name: 'The Big Lead CFB',            active: true },
  { url: 'https://www.yardbarker.com/rss/sport_merge/NCAAF',               school: 'ALL_CFB', name: 'Yardbarker CFB',              active: true },
  { url: 'https://heartlandcollegesports.com/feed/',                       school: 'ALL_CFB', name: 'Heartland College Sports',    active: true },
  { url: 'https://frontofficesports.com/feed/',                            school: 'ALL_CFB', name: 'Front Office Sports',        active: true },
  { url: 'https://www.sportico.com/feed/',                                 school: 'ALL_CFB', name: 'Sportico',                   active: true },
];

// ─── Google News Queries ──────────────────────────────────────────────────────

export const GOOGLE_NEWS_QUERIES = [

  // ── National CFB / PE / NIL ──────────────────────────────────────────────
  { query: 'Smash Capital college football',               school: 'ALL_CFB', active: true },
  { query: 'NIL collective college football',              school: 'ALL_CFB', active: true },
  { query: 'college football private equity investment',   school: 'ALL_CFB', active: true },
  { query: 'CFB transfer portal NIL deal',                 school: 'ALL_CFB', active: true },
  { query: 'House v NCAA settlement college football',     school: 'ALL_CFB', active: true },
  { query: 'Big 12 SEC conference realignment',            school: 'ALL_CFB', active: true },
  { query: 'college football fan ownership collective',    school: 'ALL_CFB', active: true },
  { query: 'college football revenue sharing athletes',    school: 'ALL_CFB', active: true },
  { query: 'NCAA lawsuit athlete compensation',            school: 'ALL_CFB', active: true },
  { query: 'college football super league PE',             school: 'ALL_CFB', active: true },
  { query: 'NIL collective shutdown investigation',        school: 'ALL_CFB', active: true },
  { query: 'college football realignment expansion',       school: 'ALL_CFB', active: true },
  { query: 'Sportico college football money',              school: 'ALL_CFB', active: true },
  { query: 'Front Office Sports college football NIL',     school: 'ALL_CFB', active: true },

  // ── Big 12 — ACTIVE ──────────────────────────────────────────────────────
  { query: 'Oklahoma Sooners NIL transfer portal',         school: 'OU',         active: true },
  { query: 'Oklahoma Sooners football',                    school: 'OU',         active: true },
  { query: 'Oklahoma State Cowboys NIL',                   school: 'OSU',        active: true },
  { query: 'Oklahoma State Cowboys football',              school: 'OSU',        active: true },
  { query: 'Texas Longhorns NIL collective',               school: 'TEXAS',      active: true },
  { query: 'Texas Longhorns football',                     school: 'TEXAS',      active: true },

  // ── Big 12 — PENDING ─────────────────────────────────────────────────────
  { query: 'Baylor Bears football NIL',                    school: 'BAYLOR',     active: false },
  { query: 'BYU Cougars football NIL',                     school: 'BYU',        active: false },
  { query: 'Cincinnati Bearcats football NIL',             school: 'CINCY',      active: false },
  { query: 'Colorado Buffaloes football NIL',              school: 'COLORADO',   active: false },
  { query: 'Houston Cougars football NIL',                 school: 'HOUSTON',    active: false },
  { query: 'Iowa State Cyclones football NIL',             school: 'IOWA_STATE', active: false },
  { query: 'Kansas Jayhawks football NIL',                 school: 'KANSAS',     active: false },
  { query: 'Kansas State Wildcats football NIL',           school: 'KSTATE',     active: false },
  { query: 'TCU Horned Frogs football NIL',                school: 'TCU',        active: false },
  { query: 'Texas Tech Red Raiders football NIL',          school: 'TEXAS_TECH', active: false },
  { query: 'UCF Knights football NIL',                     school: 'UCF',        active: false },
  { query: 'Utah Utes football NIL',                       school: 'UTAH',       active: false },
  { query: 'West Virginia Mountaineers football NIL',      school: 'WVU',        active: false },
  { query: 'Arizona Wildcats football NIL',                school: 'ARIZONA',    active: false },
  { query: 'Arizona State Sun Devils football NIL',        school: 'ASU',        active: false },

  // ── SEC — PENDING ────────────────────────────────────────────────────────
  { query: 'Alabama Crimson Tide football NIL',            school: 'ALABAMA',    active: false },
  { query: 'Arkansas Razorbacks football NIL',             school: 'ARKANSAS',   active: false },
  { query: 'Auburn Tigers football NIL',                   school: 'AUBURN',     active: false },
  { query: 'Florida Gators football NIL',                  school: 'FLORIDA',    active: false },
  { query: 'Georgia Bulldogs football NIL',                school: 'GEORGIA',    active: false },
  { query: 'Kentucky Wildcats football NIL',               school: 'KENTUCKY',   active: false },
  { query: 'LSU Tigers football NIL',                      school: 'LSU',        active: false },
  { query: 'Mississippi State Bulldogs football NIL',      school: 'MISS_STATE', active: false },
  { query: 'Missouri Tigers football NIL',                 school: 'MIZZOU',     active: false },
  { query: 'Ole Miss Rebels football NIL',                 school: 'OLE_MISS',   active: false },
  { query: 'South Carolina Gamecocks football NIL',        school: 'SOUTH_CAR',  active: false },
  { query: 'Tennessee Volunteers football NIL',            school: 'TENNESSEE',  active: false },
  { query: 'Texas A&M Aggies football NIL',                school: 'TAMU',       active: false },
  { query: 'Vanderbilt Commodores football NIL',           school: 'VANDY',      active: false },

  // ── Big Ten — PENDING ────────────────────────────────────────────────────
  { query: 'Michigan Wolverines football NIL',             school: 'MICHIGAN',   active: false },
  { query: 'Ohio State Buckeyes football NIL',             school: 'OHIO_STATE', active: false },
  { query: 'Penn State Nittany Lions football NIL',        school: 'PENN_STATE', active: false },
  { query: 'Michigan State Spartans football NIL',         school: 'MICH_STATE', active: false },
  { query: 'Iowa Hawkeyes football NIL',                   school: 'IOWA',       active: false },
  { query: 'Wisconsin Badgers football NIL',               school: 'WISCONSIN',  active: false },
  { query: 'Minnesota Golden Gophers football NIL',        school: 'MINNESOTA',  active: false },
  { query: 'Nebraska Cornhuskers football NIL',            school: 'NEBRASKA',   active: false },
  { query: 'Northwestern Wildcats football NIL',           school: 'NORTHWEST',  active: false },
  { query: 'Illinois Fighting Illini football NIL',        school: 'ILLINOIS',   active: false },
  { query: 'Indiana Hoosiers football NIL',                school: 'INDIANA',    active: false },
  { query: 'Purdue Boilermakers football NIL',             school: 'PURDUE',     active: false },
  { query: 'Rutgers Scarlet Knights football NIL',         school: 'RUTGERS',    active: false },
  { query: 'Maryland Terrapins football NIL',              school: 'MARYLAND',   active: false },
  { query: 'UCLA Bruins football NIL',                     school: 'UCLA',       active: false },
  { query: 'USC Trojans football NIL',                     school: 'USC',        active: false },
  { query: 'Oregon Ducks football NIL',                    school: 'OREGON',     active: false },
  { query: 'Washington Huskies football NIL',              school: 'WASHINGTON', active: false },

  // ── ACC — PENDING ────────────────────────────────────────────────────────
  { query: 'Clemson Tigers football NIL',                  school: 'CLEMSON',    active: false },
  { query: 'Florida State Seminoles football NIL',         school: 'FSU',        active: false },
  { query: 'Miami Hurricanes football NIL',                school: 'MIAMI',      active: false },
  { query: 'North Carolina Tar Heels football NIL',        school: 'UNC',        active: false },
  { query: 'NC State Wolfpack football NIL',               school: 'NC_STATE',   active: false },
  { query: 'Virginia Tech Hokies football NIL',            school: 'VA_TECH',    active: false },
  { query: 'Virginia Cavaliers football NIL',              school: 'VIRGINIA',   active: false },
  { query: 'Georgia Tech Yellow Jackets football NIL',     school: 'GA_TECH',    active: false },
  { query: 'Louisville Cardinals football NIL',            school: 'LOUISVILLE', active: false },
  { query: 'Syracuse Orange football NIL',                 school: 'SYRACUSE',   active: false },
  { query: 'Pittsburgh Panthers football NIL',             school: 'PITT',       active: false },
  { query: 'Wake Forest Demon Deacons football NIL',       school: 'WAKE',       active: false },
  { query: 'Boston College Eagles football NIL',           school: 'BC',         active: false },
  { query: 'Duke Blue Devils football NIL',                school: 'DUKE',       active: false },
  { query: 'Stanford Cardinal football NIL',               school: 'STANFORD',   active: false },
  { query: 'Cal Bears football NIL',                       school: 'CAL',        active: false },
  { query: 'SMU Mustangs football NIL',                    school: 'SMU',        active: false },

];
