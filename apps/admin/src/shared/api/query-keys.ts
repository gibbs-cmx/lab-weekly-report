import { createQueryKeyStore } from "@lukemorales/query-key-factory";

export const queryKeys = createQueryKeyStore({
  projects: { all: null },
  users: { list: (includeInactive: boolean) => ({ queryKey: [includeInactive] }) },
  reports: {
    week: (weekStart: string) => ({ queryKey: [weekStart] }),
    detail: (reportId: number) => ({ queryKey: [reportId] }),
    participation: (from: string, to: string) => ({ queryKey: [from, to] }),
    stats: (from: string, to: string) => ({ queryKey: [from, to] }),
  },
});
