// Static domain data for the roadmap. Ported verbatim from the original file.

export const MONTHS = [
  { label: 'SEP', yr: '26' },
  { label: 'OCT', yr: '26' },
  { label: 'NOV', yr: '26' },
  { label: 'DEC', yr: '26' },
  { label: 'JAN', yr: '27' },
  { label: 'FEB', yr: '27' },
  { label: 'MAR', yr: '27' },
]

export const FULL = [
  'September 2026',
  'October 2026',
  'November 2026',
  'December 2026',
  'January 2027',
  'February 2027',
  'March 2027',
]

export const NOW = 0

export const GOALS = [
  {
    k: 'edudot', name: 'EduDot', short: '5 BRANCHES', target: '5 new branches opened', due: '31 Dec 2026', color: '#DD6A1E',
    ms: { 0: ['Shortlist 3 locations', 'Branch 1 — open'], 1: ['Branch 2 — open'], 2: ['Branch 3 — open'], 3: ['Branch 4 — open', 'Branch 5 — open · 5/5'] },
  },
  {
    k: 'qissa', name: 'Qissa Learning', short: '120–200 STUDENTS', target: '120–200 students enrolled', due: '31 Mar 2027', color: '#0EA572',
    steps: [10, 15, 20, 25, 25, 30, 35],
  },
  {
    k: 'skillfly', name: 'SkillFly', short: '4 BRANCHES / TIE-UPS', target: '4 branches or associations across Kerala', due: '31 Mar 2027', color: '#7C5AE8',
    ms: { 0: ['Map 8 partner institutes'], 1: ['Tie-up 1 signed'], 3: ['Tie-up 2 signed'], 5: ['Tie-up 3 signed'], 6: ['Tie-up 4 signed · 4/4'] },
  },
  {
    k: 'mentorway', name: 'MentorWay', short: '5 CLIENTS', target: '5 paying clients', due: '31 Mar 2027', color: '#C6871B',
    ms: { 0: ['Offer + pricing ready'], 1: ['Client 1 onboard'], 2: ['Client 2 onboard'], 3: ['Client 3 onboard'], 4: ['Client 4 onboard'], 5: ['Client 5 onboard · 5/5'] },
  },
  {
    k: 'school', name: 'School Partnership', short: '1 COLLABORATION', target: '1 new school association', due: '31 Jan 2027', color: '#0EA572',
    ms: { 1: ['Shortlist 5 schools'], 2: ['Proposal + pilot pitch'], 3: ['MoU negotiation'], 4: ['Collaboration signed · 1/1'] },
  },
  {
    k: 'newops', name: 'New Opportunities', short: '2 LAUNCHES', target: '2 new courses or innovations', due: '31 Mar 2027', color: '#DC4A63',
    ms: { 2: ['Research — 3 concepts'], 3: ['Launch 1 — new course'], 4: ['Pilot batch + feedback'], 6: ['Launch 2 — innovation · 2/2'] },
  },
]

export const WEEKLY = [
  [
    ['EduDot: shortlist 3 sites', 'Qissa: launch September campaign', 'MentorWay: list 20 prospects'],
    ['EduDot: visit + cost sheet per site', 'Qissa: run 4 demo classes', 'SkillFly: map 8 institutes'],
    ['EduDot: sign lease, Branch 1', 'Qissa: close 5 admissions', 'MentorWay: 6 discovery calls'],
    ['EduDot: staff + soft launch', 'Qissa: reach 10 students', 'Month close: score all six targets'],
  ],
  [
    ['EduDot: Branch 2 site locked', 'SkillFly: pitch top 3 institutes', 'School: shortlist 5 schools'],
    ['EduDot: fit-out + hiring', 'Qissa: referral drive', 'MentorWay: proposal to 5 leads'],
    ['SkillFly: tie-up 1 agreement draft', 'Qissa: +8 admissions', 'MentorWay: Client 1 signed'],
    ['EduDot: Branch 2 open', 'SkillFly: tie-up 1 signed', 'Month close: review 25-student mark'],
  ],
  [
    ['EduDot: Branch 3 site locked', 'School: build proposal deck', 'NewOps: gather 3 course concepts'],
    ['Qissa: batch expansion planning', 'MentorWay: 8 outreach calls', 'School: pitch meeting 1'],
    ['EduDot: fit-out + staff ready', 'MentorWay: Client 2 signed', 'NewOps: validate demand'],
    ['EduDot: Branch 3 open', 'Qissa: reach 45 students', 'Month close: half-way review'],
  ],
  [
    ['EduDot: Branch 4 site + fit-out', 'NewOps: finalise course 1 syllabus', 'School: MoU terms drafted'],
    ['EduDot: Branch 5 site locked', 'SkillFly: tie-up 2 negotiation', 'Qissa: December enrolment push'],
    ['EduDot: Branch 4 open', 'MentorWay: Client 3 signed', 'NewOps: launch 1 marketing'],
    ['EduDot: Branch 5 open — target met', 'SkillFly: tie-up 2 signed', 'Year close: 70-student check'],
  ],
  [
    ['School: finalise MoU', 'NewOps: pilot batch enrolment', 'Qissa: January intake campaign'],
    ['School: sign collaboration', 'MentorWay: 6 new leads', 'SkillFly: scout tie-up 3'],
    ['NewOps: pilot batch starts', 'Qissa: +12 admissions', 'MentorWay: Client 4 signed'],
    ['NewOps: collect pilot feedback', 'Qissa: reach 95 students', 'Month close: school goal ✓'],
  ],
  [
    ['SkillFly: tie-up 3 agreement', 'Qissa: alumni referral drive', 'NewOps: shape innovation 2'],
    ['MentorWay: Client 5 proposal', 'Qissa: +10 admissions', 'SkillFly: partner training plan'],
    ['SkillFly: tie-up 3 signed', 'MentorWay: Client 5 signed', 'NewOps: build launch assets'],
    ['Qissa: reach 125 students', 'Review gaps vs 31 Mar deadlines', 'Month close: 5/6 targets on track'],
  ],
  [
    ['SkillFly: tie-up 4 negotiation', 'NewOps: launch 2 go-live plan', 'Qissa: final admission push'],
    ['SkillFly: tie-up 4 signed', 'NewOps: launch 2 live', 'Qissa: +15 admissions'],
    ['Qissa: cross 150 students', 'MentorWay: renewals + case studies', 'SkillFly: 4/4 confirmed'],
    ['Qissa: close at 160+ students', 'Full-year audit of all 6 targets', 'Plan FY27–28 targets'],
  ],
]

export const STAGES = [
  { k: 'todo', label: 'TODO', color: '#DD6A1E', tint: 'rgba(221,106,30,.14)' },
  { k: 'prog', label: 'IN PROGRESS', color: '#C6871B', tint: 'rgba(198,135,27,.14)' },
  { k: 'done', label: 'DONE', color: '#0EA572', tint: 'rgba(14,165,114,.14)' },
]

export const DUE_ISO = {
  edudot: '2026-12-31', qissa: '2027-03-31', skillfly: '2027-03-31',
  mentorway: '2027-03-31', school: '2027-01-31', newops: '2027-03-31',
}

// Curated, professional swatch set (readable on light and dark): green, blue,
// violet, orange, amber, rose, slate.
export const PALETTE = ['#0EA572', '#2D74D8', '#7C5AE8', '#DD6A1E', '#C6871B', '#DC4A63', '#5B6B7C']

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Persisted state slice names. These match the keys used by the /api/state
// endpoints and the `app_state` collection in MongoDB (see src/lib/api.js and
// api/_lib/slices.js). Persistence itself lives server-side.
export const SLICES = [
  'done', 'custom', 'notes', 'edits', 'hidden',
  'todos', 'archive', 'meetings', 'goals', 'goalEdits', 'branding', 'brandTags', 'leads',
]

// Lead pipeline: consultation departments (type of lead), shown as coloured chips.
// Adjust these labels/colours to your actual services.
export const DEPARTMENTS = [
  { k: 'finance', label: 'Finance', color: '#0EA572' },
  { k: 'operation', label: 'Operation', color: '#2D74D8' },
  { k: 'marketing', label: 'Marketing', color: '#DD6A1E' },
  { k: 'sales', label: 'Sales', color: '#7C5AE8' },
  { k: 'other', label: 'Other', color: '#5B6B7C' },
]

// Pipeline stages in order. `subs` are the sub-statuses a lead can carry while in
// that stage (empty = no sub-status for that stage).
export const LEAD_STAGES = [
  { k: 'lead', label: 'Lead', color: '#5B6B7C', subs: [] },
  {
    k: 'contacted', label: 'Contacted', color: '#2D74D8',
    subs: ['Qualified', 'Not Qualified', 'Not Connected', 'Not Inquiry / Wrong Number', 'Enquiry for other service'],
  },
  {
    k: 'active', label: 'Active Discussion', color: '#7C5AE8',
    subs: ['Requirement Identified', 'Follow-up Scheduled', 'Meeting Scheduled'],
  },
  { k: 'meeting_sch', label: 'Meeting Scheduled', color: '#C6871B', subs: [] },
  { k: 'meeting_done', label: 'Meeting Done', color: '#DD6A1E', subs: [] },
  { k: 'proposal', label: 'Proposal Shared', color: '#0FA3A3', subs: [] },
  {
    k: 'final', label: 'Final Deal', color: '#0EA572',
    subs: ['Closed Won', 'Proposal Under Review', 'Pending Payment Issue', 'Lost - Invalid Prospect'],
  },
]

// Flattened unique sub-statuses (for the "sub-note wise" filter).
export const LEAD_SUBS = [...new Set(LEAD_STAGES.flatMap((s) => s.subs))]

// Personal-branding: production stages (in pipeline order) and target platforms.
export const BRAND_STAGES = [
  { k: 'shoot', label: 'Shoot', color: '#DD6A1E' },
  { k: 'edit', label: 'Edit', color: '#C6871B' },
  { k: 'post', label: 'Post', color: '#0EA572' },
]

export const PLATFORMS = [
  { k: 'instagram', label: 'Instagram', color: '#B45FD6' },
  { k: 'youtube', label: 'YouTube', color: '#DC4A63' },
  { k: 'facebook', label: 'Facebook', color: '#2D74D8' },
]
