import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CourseWizardInput } from "@/lib/validations/admin";

export const EMPTY_COURSE_DRAFT: CourseWizardInput = {
  code: "",
  title: "",
  description: "",
  departmentId: "",
  credits: 3,
  prerequisiteIds: [],
};

interface CourseWizardState {
  step: number;
  draft: CourseWizardInput;
  setStep: (step: number) => void;
  saveDraft: (draft: CourseWizardInput) => void;
  reset: () => void;
}

/**
 * Draft of the "New course" wizard. Session-scoped (sessionStorage) so a refresh or a detour to another
 * admin page doesn't lose half-entered data, but it doesn't linger after the tab closes.
 */
export const useCourseWizard = create<CourseWizardState>()(
  persist(
    (set) => ({
      step: 0,
      draft: EMPTY_COURSE_DRAFT,
      setStep: (step) => set({ step }),
      saveDraft: (draft) => set({ draft }),
      reset: () => set({ step: 0, draft: EMPTY_COURSE_DRAFT }),
    }),
    {
      name: "quad-course-wizard",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);
