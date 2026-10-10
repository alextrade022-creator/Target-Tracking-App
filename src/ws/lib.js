// Workspace domain: businesses, their departments, and small helpers.
//
// `mine: true` marks a department you personally run. Departments with
// `mine: false` are ones you only watch — tasks in them count as "waiting on
// the team", which feeds the delegation views.

export const BIZ_COLORS = ['#2563EB', '#7C5AE8', '#DD6A1E', '#16A34A', '#0FA3A3', '#DC4A63', '#C6871B', '#5B6B7C']

const dept = (id, name, mine) => ({ id, name, mine })

export const DEFAULT_BUSINESSES = [
  {
    id: 'edusolve', name: 'Edusolve', color: '#2563EB',
    departments: [
      dept('finance', 'Finance', true), dept('marketing', 'Marketing', true), dept('operation', 'Operation', true),
      dept('sales', 'Sales', false), dept('hr', 'HR', false),
    ],
  },
  {
    id: 'skillfly', name: 'SkillFly', color: '#7C5AE8',
    departments: [
      dept('finance', 'Finance', true), dept('operation', 'Operation', false),
      dept('marketing', 'Marketing', false), dept('sales', 'Sales', false),
    ],
  },
  {
    id: 'edudot', name: 'EduDot', color: '#DD6A1E',
    departments: [
      dept('marketing', 'Marketing', true), dept('finance', 'Finance', true),
      dept('operation', 'Operation', false), dept('sales', 'Sales', false),
    ],
  },
  {
    id: 'consulting', name: 'Business Consultation', color: '#16A34A',
    departments: [
      dept('finance', 'Finance', true), dept('marketing', 'Marketing', true),
      dept('operation', 'Operation', true), dept('sales', 'Sales', true),
    ],
  },
  {
    id: 'ebc', name: 'EBC IT Solution', color: '#0FA3A3',
    departments: [
      dept('sales', 'Sales', true), dept('strategy', 'Strategy', true),
      dept('operation', 'Operation', false), dept('finance', 'Finance', false), dept('tech', 'Tech', false),
    ],
  },
  {
    id: 'qissa', name: 'Qissa Learning', color: '#DC4A63',
    departments: [
      dept('finance', 'Finance', true), dept('marketing', 'Marketing', true),
      dept('operation', 'Operation', true), dept('sales', 'Sales', true),
    ],
  },
]

export const uid = (prefix) => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export const slug = (s) =>
  String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || uid('d')

export function greeting(now = new Date()) {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function longDate(now = new Date()) {
  return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
