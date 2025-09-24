export type TeaExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface OnboardingData {
  language: "ja" | "en" | "es";
  experienceLevel: TeaExperienceLevel;
  completed: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}
