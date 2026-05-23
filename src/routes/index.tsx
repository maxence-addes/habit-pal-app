import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sun, Moon } from "lucide-react";

const INSPIRATIONS: { image: string; quote: string }[] = [
  {
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&q=80",
    quote: "Les petites actions soutenues dans le temps se transforment en changements d'identité profonds.",
  },
  {
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1280&q=80",
    quote: "La discipline est le pont entre les objectifs et les accomplissements.",
  },
  {
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=80",
    quote: "Concentrez-vous sur la fréquence, pas sur l'intensité.",
  },
  {
    image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1280&q=80",
    quote: "Un jour ou jour 1. C'est vous qui décidez.",
  },
  {
    image: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1280&q=80",
    quote: "La motivation vous fait commencer, l'habitude vous fait continuer.",
  },
  {
    image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1280&q=80",
    quote: "Ce que vous faites chaque jour compte plus que ce que vous faites de temps en temps.",
  },
  {
    image: "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=1280&q=80",
    quote: "Le succès est la somme de petits efforts répétés jour après jour.",
  },
  {
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=80",
    quote: "Les habitudes sont l'intérêt composé du développement personnel.",
  },
  {
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1280&q=80",
    quote: "Vous n'atteignez pas le niveau de vos objectifs, vous tombez au niveau de vos systèmes.",
  },
  {
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1280&q=80",
    quote: "La constance bat l'intensité à chaque fois.",
  },
];
import {
  computeStreak,
  describeSchedule,
  getWeekDates,
  isScheduledOn,
  loadHabits,
  saveHabits,
  todayKey,
  type Habit,
  type Schedule,
} from "@/lib/habits";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/")({
  component: Index,
});

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEKDAY_PICKER = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "M" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

function Index() {
  const { theme, toggle } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newScheduleType, setNewScheduleType] =
    useState<"daily" | "weekly" | "once">("daily");
  const [newWeekdays, setNewWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newDates, setNewDates] = useState<Date[]>([]);

  useEffect(() => {
    setHabits(loadHabits());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveHabits(habits);
  }, [habits, mounted]);

  const today = todayKey();
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayIndex = weekDates.findIndex((d) => todayKey(d) === today);

  const toggleToday = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const done = h.completions.includes(today);
        return {
          ...h,
          completions: done
            ? h.completions.filter((c) => c !== today)
            : [...h.completions, today],
        };
      }),
    );
  };

  const removeHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    let schedule: Schedule = { type: "daily" };
    if (newScheduleType === "weekly") {
      schedule = { type: "weekly", weekdays: newWeekdays };
    } else if (newScheduleType === "once") {
      schedule = {
        type: "once",
        dates: newDates.map((d) => todayKey(d)),
      };
    }
    setHabits((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        detail: newDetail.trim() || "Quotidien",
        completions: [],
        schedule,
      },
    ]);
    setNewName("");
    setNewDetail("");
    setNewScheduleType("daily");
    setNewWeekdays([1, 2, 3, 4, 5]);
    setNewDates([]);
    setAdding(false);
  };

  // Week completion based on scheduled habits per day
  const weekDoneFlags = weekDates.map((d) => {
    const key = todayKey(d);
    const scheduled = habits.filter((h) => isScheduledOn(h, d));
    return (
      scheduled.length > 0 && scheduled.every((h) => h.completions.includes(key))
    );
  });
  const weekAnyFlags = weekDates.map((d) => {
    const key = todayKey(d);
    return habits.some(
      (h) => isScheduledOn(h, d) && h.completions.includes(key),
    );
  });

  const completionPct = (() => {
    let total = 0;
    let done = 0;
    weekDates.forEach((d) => {
      const key = todayKey(d);
      habits.forEach((h) => {
        if (!isScheduledOn(h, d)) return;
        total += 1;
        if (h.completions.includes(key)) done += 1;
      });
    });
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  })();

  const todaysHabits = habits.filter((h) =>
    isScheduledOn(h, new Date()),
  );
  const upcomingHabits = habits.filter(
    (h) => !isScheduledOn(h, new Date()),
  );

  const bestStreak = habits.reduce((m, h) => Math.max(m, computeStreak(h.completions)), 0);

  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-primary/10">
      <header className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium capitalize">{dateLabel}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                Daily Rhythms
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/80 ring-1 ring-border px-3 py-1.5 rounded-full">
                <div className="size-4 bg-brand-primary rounded-full ring-4 ring-brand-primary/10" />
                <span className="text-sm font-medium">
                  Série de {bestStreak} {bestStreak > 1 ? "jours" : "jour"}
                </span>
              </div>
              <button
                onClick={toggle}
                aria-label={theme === "dark" ? "Passer en mode jour" : "Passer en mode nuit"}
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-muted ring-1 ring-border"
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center transform rounded-full bg-card shadow transition-transform",
                    theme === "dark" ? "translate-x-6" : "translate-x-1"
                  )}
                >
                  {theme === "dark" ? (
                    <Moon className="w-3 h-3 text-foreground" />
                  ) : (
                    <Sun className="w-3 h-3 text-brand-primary" />
                  )}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-muted/40 ring-1 ring-border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-medium text-muted-foreground">Progression hebdomadaire</h2>
              <span className="text-sm font-medium text-brand-muted">{completionPct}% complété</span>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {weekDates.map((d, i) => {
                const isToday = i === todayIndex;
                const allDone = weekDoneFlags[i];
                const anyDone = weekAnyFlags[i];
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider",
                        isToday ? "text-brand-primary" : "text-muted-foreground"
                      )}
                    >
                      {DAY_LABELS[i]}
                    </span>
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center transition-all",
                        allDone
                          ? "bg-brand-primary"
                          : isToday
                            ? "ring-1 ring-brand-primary ring-offset-2"
                            : anyDone
                              ? "bg-brand-primary/20"
                              : "bg-muted/50"
                      )}
                    >
                      {anyDone && !allDone && (
                        <div className="size-2 bg-brand-primary rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <section className="py-0 px-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {todaysHabits.map((h) => {
            const done = h.completions.includes(today);
            const streak = computeStreak(h.completions);
            return (
              <div
                key={h.id}
                className="group flex items-center justify-between p-4 bg-card ring-1 ring-border rounded-xl transition-transform hover:-translate-y-px"
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleToday(h.id)}
                    aria-label={done ? "Marquer comme non fait" : "Marquer comme fait"}
                    className={cn(
                      "size-5 rounded-md flex items-center justify-center transition-colors cursor-pointer",
                      done
                        ? "bg-brand-primary ring-1 ring-brand-primary"
                        : "ring-1 ring-border hover:ring-brand-primary"
                    )}
                  >
                    {done && <div className="size-1.5 bg-white rounded-full" />}
                  </button>
                  <div>
                    <p
                      className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}
                    >
                      {h.name}
                    </p>
                    <p className={cn("text-xs", done ? "text-muted-foreground/50" : "text-muted-foreground")}>
                      {h.detail} · {describeSchedule(h.schedule)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      done ? "text-brand-primary" : "text-muted-foreground group-hover:text-brand-primary"
                    )}
                  >
                    {done ? "Fait" : `Série de ${streak} j`}
                  </span>
                  <button
                    onClick={() => removeHabit(h.id)}
                    aria-label="Supprimer l'habitude"
                    className="text-muted-foreground/40 hover:text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}

          {todaysHabits.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Rien de prévu aujourd'hui. Ajoutez une habitude ou une tâche.
            </p>
          )}

          {upcomingHabits.length > 0 && (
            <div className="pt-6">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Planifié
              </p>
              <div className="space-y-2">
                {upcomingHabits.map((h) => (
                  <div
                    key={h.id}
                    className="group flex items-center justify-between p-3 bg-muted/40 ring-1 ring-border rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground/60">
                        {h.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {describeSchedule(h.schedule)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeHabit(h.id)}
                      aria-label="Supprimer"
                      className="text-muted-foreground/40 hover:text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 flex justify-center">
            {!adding ? (
              <button
                onClick={() => setAdding(true)}
                className="bg-foreground text-background text-sm font-medium py-2 px-4 flex items-center gap-2 rounded-lg ring-1 ring-foreground hover:bg-foreground/80 transition-colors cursor-pointer"
              >
                <span className="text-lg leading-none">+</span>
                Nouvelle habitude ou tâche
              </button>
            ) : (
              <div className="w-full bg-card ring-1 ring-border rounded-xl p-4 space-y-4">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom de l'habitude ou de la tâche"
                  className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => e.key === "Enter" && addHabit()}
                />
                <input
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  placeholder="Détail (ex: 10 minutes • Matin)"
                  className="w-full text-xs bg-transparent outline-none placeholder:text-muted-foreground/50"
                />

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Fréquence
                  </p>
                  <div className="flex gap-1 bg-muted/60 p-1 rounded-lg">
                    {(
                      [
                        ["daily", "Quotidien"],
                        ["weekly", "Hebdomadaire"],
                        ["once", "Dates précises"],
                      ] as const
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNewScheduleType(val)}
                        className={cn(
                          "flex-1 text-xs py-1.5 rounded-md transition-colors",
                          newScheduleType === val
                            ? "bg-card ring-1 ring-border text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {newScheduleType === "weekly" && (
                    <div className="flex gap-1 pt-1">
                      {WEEKDAY_PICKER.map((d) => {
                        const active = newWeekdays.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() =>
                              setNewWeekdays((prev) =>
                                prev.includes(d.value)
                                  ? prev.filter((v) => v !== d.value)
                                  : [...prev, d.value],
                              )
                            }
                            className={cn(
                              "size-8 text-xs rounded-md transition-colors",
                              active
                                ? "bg-brand-primary text-white"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {newScheduleType === "once" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left text-xs px-3 py-2 rounded-md bg-muted/60 hover:bg-muted text-foreground/60"
                        >
                          {newDates.length === 0
                            ? "Sélectionner une ou plusieurs dates"
                            : `${newDates.length} date${newDates.length > 1 ? "s" : ""} sélectionnée${newDates.length > 1 ? "s" : ""}`}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="multiple"
                          selected={newDates}
                          onSelect={(d) => setNewDates(d ?? [])}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewName("");
                      setNewDetail("");
                      setNewScheduleType("daily");
                      setNewWeekdays([1, 2, 3, 4, 5]);
                      setNewDates([]);
                    }}
                    className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addHabit}
                    className="text-xs px-3 py-1.5 rounded-md bg-brand-primary text-white hover:opacity-90"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-muted/40 ring-1 ring-border rounded-2xl">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Meilleure série
              </p>
              <p className="text-2xl font-medium">
                {bestStreak} <span className="text-sm font-normal text-muted-foreground">jours</span>
              </p>
              <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all"
                  style={{ width: `${Math.min(100, (bestStreak / 30) * 100)}%` }}
                />
              </div>
            </div>
            <div className="p-6 bg-muted/40 ring-1 ring-border rounded-2xl">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Taux de complétion
              </p>
              <p className="text-2xl font-medium">
                {completionPct}% <span className="text-sm font-normal text-muted-foreground">semaine</span>
              </p>
              <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-muted transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-12">
            <img
              src={inspirationImg}
              alt="Verre d'eau sur une surface de pierre"
              width={1280}
              height={512}
              loading="lazy"
              className="w-full aspect-[3/1] object-cover outline-1 -outline-offset-1 outline-border rounded-[min(1vw,12px)]"
            />
            <p className="mt-4 text-sm text-muted-foreground max-w-[56ch] text-pretty">
              Les petites actions soutenues dans le temps se transforment en
              changements d'identité profonds. Concentrez-vous sur la fréquence,
              pas sur l'intensité.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
