import { createQueryKeyStore } from "@lukemorales/query-key-factory";

export const queryKeys = createQueryKeyStore({
  projects: { active: null },
  reports: {
    mine: (from?: string, to?: string) => ({ queryKey: [from, to] }),
    week: (weekStart: string) => ({ queryKey: [weekStart] }),
    stats: (from?: string, to?: string) => ({ queryKey: [from, to] }),
  },
});
