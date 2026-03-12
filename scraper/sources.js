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

// ─── School Config (used by scriptgen for school-specific outros) ─────────────

export const SCHOOL_CONFIG = {
  OU: {
    name: 'Oklahoma Sooners',
    fanbase: 'Sooner Nation',
    conference: 'SEC',
    rivalries: ['Texas', 'Oklahoma State'],
    active: true
  },
  OSU: {
    name: 'Oklahoma State Cowboys',
    fanbase: 'Cowboy fans',
    conference: 'Big 12',
    rivalries: ['Oklahoma'],
    active: true
  },
  TEXAS: {
    name: 'Texas Longhorns',
    fanbase: 'Longhorn Nation',
    conference: 'SEC',
    rivalries: ['Oklahoma', 'Texas A&M'],
    active: true
  },
  BAYLOR:     { name: 'Baylor Bears',              fanbase: 'Baylor Nation',      conference: 'Big 12',  rivalries: ['TCU'],           active: false },
  BYU:        { name: 'BYU Cougars',               fanbase: 'Cougar fans',        conference: 'Big 12',  rivalries: ['Utah'],          active: false },
  CINCY:      { name: 'Cincinnati Bearcats',        fanbase: 'Bearcat fans',       conference: 'Big 12',  rivalries: ['UCF'],           active: false },
  COLORADO:   { name: 'Colorado Buffaloes',         fanbase: 'Buff Nation',        conference: 'Big 12',  rivalries: ['Utah'],          active: false },
  HOUSTON:    { name: 'Houston Cougars',            fanbase: 'Cougar fans',        conference: 'Big 12',  rivalries: ['Cincinnati'],    active: false },
  IOWA_STATE: { name: 'Iowa State Cyclones',        fanbase: 'Cyclone fans',       conference: 'Big 12',  rivalries: ['Iowa'],          active: false },
  KANSAS:     { name: 'Kansas Jayhawks',            fanbase: 'Jayhawk Nation',     conference: 'Big 12',  rivalries: ['Kansas State'],  active: false },
  KSTATE:     { name: 'Kansas State Wildcats',      fanbase: 'Wildcat fans',       conference: 'Big 12',  rivalries: ['Kansas'],        active: false },
  TCU:        { name: 'TCU Horned Frogs',           fanbase: 'Frog fans',          conference: 'Big 12',  rivalries: ['Baylor'],        active: false },
  TEXAS_TECH: { name: 'Texas Tech Red Raiders',     fanbase: 'Red Raider fans',    conference: 'Big 12',  rivalries: ['TCU'],           active: false },
  UCF:        { name: 'UCF Knights',                fanbase: 'Knight Nation',      conference: 'Big 12',  rivalries: ['Cincinnati'],    active: false },
  UTAH:       { name: 'Utah Utes',                  fanbase: 'Ute fans',           conference: 'Big 12',  rivalries: ['BYU'],           active: false },
  WVU:        { name: 'West Virginia Mountaineers', fanbase: 'Mountaineer fans',   conference: 'Big 12',  rivalries: ['Pittsburgh'],    active: false },
  ARIZONA:    { name: 'Arizona Wildcats',           fanbase: 'Wildcat fans',       conference: 'Big 12',  rivalries: ['Arizona State'], active: false },
  ASU:        { name: 'Arizona State Sun Devils',   fanbase: 'Sun Devil fans',     conference: 'Big 12',  rivalries: ['Arizona'],       active: false },
  ALABAMA:    { name: 'Alabama Crimson Tide',       fanbase: 'Crimson Tide Nation',conference: 'SEC',     rivalries: ['Auburn'],        active: false },
  ARKANSAS:   { name: 'Arkansas Razorbacks',        fanbase: 'Razorback fans',     conference: 'SEC',     rivalries: ['LSU'],           active: false },
  AUBURN:     { name: 'Auburn Tigers',              fanbase: 'Tiger fans',         conference: 'SEC',     rivalries: ['Alabama'],       active: false },
  FLORIDA:    { name: 'Florida Gators',             fanbase: 'Gator Nation',       conference: 'SEC',     rivalries: ['Georgia'],       active: false },
  GEORGIA:    { name: 'Georgia Bulldogs',           fanbase: 'Bulldog Nation',     conference: 'SEC',     rivalries: ['Florida'],       active: false },
  KENTUCKY:   { name: 'Kentucky Wildcats',          fanbase: 'Big Blue Nation',    conference: 'SEC',     rivalries: ['Tennessee'],     active: false },
  LSU:        { name: 'LSU Tigers',                 fanbase: 'Tiger Nation',       conference: 'SEC',     rivalries: ['Alabama'],       active: false },
  MISS_STATE: { name: 'Mississippi State Bulldogs', fanbase: 'Bulldog fans',       conference: 'SEC',     rivalries: ['Ole Miss'],      active: false },
  MIZZOU:     { name: 'Missouri Tigers',            fanbase: 'Tiger fans',         conference: 'SEC',     rivalries: ['Kansas'],        active: false },
  OLE_MISS:   { name: 'Ole Miss Rebels',            fanbase: 'Rebel fans',         conference: 'SEC',     rivalries: ['Mississippi State'], active: false },
  SOUTH_CAR:  { name: 'South Carolina Gamecocks',   fanbase: 'Gamecock fans',      conference: 'SEC',     rivalries: ['Clemson'],       active: false },
  TENNESSEE:  { name: 'Tennessee Volunteers',       fanbase: 'Vol Nation',         conference: 'SEC',     rivalries: ['Alabama'],       active: false },
  TAMU:       { name: 'Texas A&M Aggies',           fanbase: 'Aggie Nation',       conference: 'SEC',     rivalries: ['Texas'],         active: false },
  VANDY:      { name: 'Vanderbilt Commodores',      fanbase: 'Commodore fans',     conference: 'SEC',     rivalries: ['Tennessee'],     active: false },
  MICHIGAN:   { name: 'Michigan Wolverines',        fanbase: 'Wolverine Nation',   conference: 'Big Ten', rivalries: ['Ohio State'],    active: false },
  OHIO_STATE: { name: 'Ohio State Buckeyes',        fanbase: 'Buckeye Nation',     conference: 'Big Ten', rivalries: ['Michigan'],      active: false },
  PENN_STATE: { name: 'Penn State Nittany Lions',   fanbase: 'Penn State fans',    conference: 'Big Ten', rivalries: ['Ohio State'],    active: false },
  MICH_STATE: { name: 'Michigan State Spartans',    fanbase: 'Spartan fans',       conference: 'Big Ten', rivalries: ['Michigan'],      active: false },
  IOWA:       { name: 'Iowa Hawkeyes',              fanbase: 'Hawkeye fans',       conference: 'Big Ten', rivalries: ['Iowa State'],    active: false },
  WISCONSIN:  { name: 'Wisconsin Badgers',          fanbase: 'Badger fans',        conference: 'Big Ten', rivalries: ['Minnesota'],     active: false },
  MINNESOTA:  { name: 'Minnesota Golden Gophers',   fanbase: 'Gopher fans',        conference: 'Big Ten', rivalries: ['Wisconsin'],     active: false },
  NEBRASKA:   { name: 'Nebraska Cornhuskers',       fanbase: 'Husker Nation',      conference: 'Big Ten', rivalries: ['Iowa'],          active: false },
  NORTHWEST:  { name: 'Northwestern Wildcats',      fanbase: 'Wildcat fans',       conference: 'Big Ten', rivalries: ['Illinois'],      active: false },
  ILLINOIS:   { name: 'Illinois Fighting Illini',   fanbase: 'Illini fans',        conference: 'Big Ten', rivalries: ['Northwestern'],  active: false },
  INDIANA:    { name: 'Indiana Hoosiers',           fanbase: 'Hoosier fans',       conference: 'Big Ten', rivalries: ['Purdue'],        active: false },
  PURDUE:     { name: 'Purdue Boilermakers',        fanbase: 'Boilermaker fans',   conference: 'Big Ten', rivalries: ['Indiana'],       active: false },
  RUTGERS:    { name: 'Rutgers Scarlet Knights',    fanbase: 'Scarlet Knight fans',conference: 'Big Ten', rivalries: ['Penn State'],    active: false },
  MARYLAND:   { name: 'Maryland Terrapins',         fanbase: 'Terrapin fans',      conference: 'Big Ten', rivalries: ['Penn State'],    active: false },
  UCLA:       { name: 'UCLA Bruins',                fanbase: 'Bruin fans',         conference: 'Big Ten', rivalries: ['USC'],           active: false },
  USC:        { name: 'USC Trojans',                fanbase: 'Trojan fans',        conference: 'Big Ten', rivalries: ['UCLA'],          active: false },
  OREGON:     { name: 'Oregon Ducks',               fanbase: 'Duck fans',          conference: 'Big Ten', rivalries: ['Washington'],    active: false },
  WASHINGTON: { name: 'Washington Huskies',         fanbase: 'Husky fans',         conference: 'Big Ten', rivalries: ['Oregon'],        active: false },
  CLEMSON:    { name: 'Clemson Tigers',             fanbase: 'Tiger fans',         conference: 'ACC',     rivalries: ['South Carolina'],active: false },
  FSU:        { name: 'Florida State Seminoles',    fanbase: 'Seminole fans',      conference: 'ACC',     rivalries: ['Florida'],       active: false },
  MIAMI:      { name: 'Miami Hurricanes',           fanbase: 'Cane fans',          conference: 'ACC',     rivalries: ['Florida State'], active: false },
  UNC:        { name: 'North Carolina Tar Heels',   fanbase: 'Tar Heel fans',      conference: 'ACC',     rivalries: ['NC State'],      active: false },
  NC_STATE:   { name: 'NC State Wolfpack',          fanbase: 'Wolfpack fans',      conference: 'ACC',     rivalries: ['UNC'],           active: false },
  VA_TECH:    { name: 'Virginia Tech Hokies',       fanbase: 'Hokie fans',         conference: 'ACC',     rivalries: ['Virginia'],      active: false },
  VIRGINIA:   { name: 'Virginia Cavaliers',         fanbase: 'Cavalier fans',      conference: 'ACC',     rivalries: ['Virginia Tech'], active: false },
  GA_TECH:    { name: 'Georgia Tech Yellow Jackets',fanbase: 'Jacket fans',        conference: 'ACC',     rivalries: ['Georgia'],       active: false },
  LOUISVILLE: { name: 'Louisville Cardinals',       fanbase: 'Cardinal fans',      conference: 'ACC',     rivalries: ['Kentucky'],      active: false },
  SYRACUSE:   { name: 'Syracuse Orange',            fanbase: 'Orange fans',        conference: 'ACC',     rivalries: ['Pittsburgh'],    active: false },
  PITT:       { name: 'Pittsburgh Panthers',        fanbase: 'Panther fans',       conference: 'ACC',     rivalries: ['Penn State'],    active: false },
  WAKE:       { name: 'Wake Forest Demon Deacons',  fanbase: 'Deacon fans',        conference: 'ACC',     rivalries: ['NC State'],      active: false },
  BC:         { name: 'Boston College Eagles',      fanbase: 'Eagle fans',         conference: 'ACC',     rivalries: ['Syracuse'],      active: false },
  DUKE:       { name: 'Duke Blue Devils',           fanbase: 'Blue Devil fans',    conference: 'ACC',     rivalries: ['UNC'],           active: false },
  STANFORD:   { name: 'Stanford Cardinal',          fanbase: 'Cardinal fans',      conference: 'ACC',     rivalries: ['Cal'],           active: false },
  CAL:        { name: 'Cal Bears',                  fanbase: 'Bear fans',          conference: 'ACC',     rivalries: ['Stanford'],      active: false },
  SMU:        { name: 'SMU Mustangs',               fanbase: 'Mustang fans',       conference: 'ACC',     rivalries: ['TCU'],           active: false },
};
