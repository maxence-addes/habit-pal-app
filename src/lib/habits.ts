export type Schedule =
  | { type: "daily" }
  | { type: "weekly"; weekdays: number[] } // 0=Sun..6=Sat
  | { type: "once"; dates: string[] } // YYYY-MM-DD list
  | { type: "deadline"; dueDate: string }; // YYYY-MM-DD — à faire pour cette date

export type Habit = {
  id: string;
  name: string;
  detail: string;
  completions: string[]; // ISO date strings (YYYY-MM-DD)
  schedule: Schedule;
};

const STORAGE_KEY = "daily-rhythms.habits.v1";

export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getWeekDates = (ref = new Date()) => {
  const day = ref.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export const computeStreak = (completions: string[]): number => {
  const set = new Set(completions);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const isScheduledOn = (habit: Habit, date: Date): boolean => {
  const s = habit.schedule ?? { type: "daily" };
  if (s.type === "daily") return true;
  if (s.type === "weekly") return s.weekdays.includes(date.getDay());
  if (s.type === "once") return s.dates.includes(todayKey(date));
  return true;
};

export const describeSchedule = (s: Schedule): string => {
  if (!s || s.type === "daily") return "Tous les jours";
  if (s.type === "weekly") {
    const labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    if (s.weekdays.length === 0) return "Aucun jour";
    return s.weekdays
      .slice()
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
      .map((d) => labels[d])
      .join(" · ");
  }
  if (s.type === "once") {
    if (s.dates.length === 0) return "Aucune date";
    if (s.dates.length === 1) {
      const [y, m, d] = s.dates[0].split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
    return `${s.dates.length} dates planifiées`;
  }
  return "";
};

export const loadHabits = (): Habit[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHabits();
    const parsed = JSON.parse(raw) as Habit[];
    // Backward compat: ensure schedule exists
    return parsed.map((h) => ({
      ...h,
      schedule: h.schedule ?? { type: "daily" },
    }));
  } catch {
    return defaultHabits();
  }
};

export const saveHabits = (habits: Habit[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
};

const defaultHabits = (): Habit[] => {
  const today = todayKey();
  return [
    {
      id: crypto.randomUUID(),
      name: "Méditation matinale",
      detail: "15 minutes • 7:00",
      completions: [],
      schedule: { type: "daily" },
    },
    {
      id: crypto.randomUUID(),
      name: "Session de travail profond",
      detail: "90 minutes • 9:30",
      completions: [today],
      schedule: { type: "weekly", weekdays: [1, 2, 3, 4, 5] },
    },
    {
      id: crypto.randomUUID(),
      name: "Objectif d'hydratation",
      detail: "2,5 litres • Toute la journée",
      completions: [],
      schedule: { type: "daily" },
    },
  ];
};