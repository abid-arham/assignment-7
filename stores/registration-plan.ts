import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface PlanItem {
  sectionId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  sectionCode: string;
  instructorName: string;
  semesterId: string;
  semesterName: string;
  tuitionPerCredit: number;
}

interface RegistrationPlanState {
  /** The student the saved plan belongs to; a different account on this browser starts empty. */
  ownerId: string | null;
  items: PlanItem[];
  claim: (ownerId: string) => void;
  add: (item: PlanItem) => void;
  remove: (sectionId: string) => void;
  clear: () => void;
}

/**
 * The student's shortlist of sections before registering (like a cart). Global client state: the
 * section list adds to it, the plan panel / mobile sheet reads it, and it survives reloads via
 * localStorage. Rehydration is manual (skipHydration) so server and first client render match.
 */
export const useRegistrationPlan = create<RegistrationPlanState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      items: [],
      claim: (ownerId) => {
        if (get().ownerId !== ownerId) set({ ownerId, items: [] });
      },
      add: (item) =>
        set((state) =>
          state.items.some((i) => i.sectionId === item.sectionId) ? state : { items: [...state.items, item] },
        ),
      remove: (sectionId) => set((state) => ({ items: state.items.filter((i) => i.sectionId !== sectionId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "quad-registration-plan",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ ownerId, items }) => ({ ownerId, items }),
      skipHydration: true,
    },
  ),
);

export function planTotals(items: PlanItem[]) {
  const credits = items.reduce((sum, i) => sum + i.credits, 0);
  const tuition = items.reduce((sum, i) => sum + i.credits * i.tuitionPerCredit, 0);
  return { credits, tuition };
}
