"use client";

import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { TeaExperienceLevel } from "@/types/onboarding";

interface ExperienceOption {
  level: TeaExperienceLevel;
  title: {
    ja: string;
    en: string;
    es: string;
  };
  description: {
    ja: string;
    en: string;
    es: string;
  };
  icon: string;
}

const experienceOptions: ExperienceOption[] = [
  {
    level: "beginner",
    title: {
      ja: "初心者",
      en: "Beginner",
      es: "Principiante",
    },
    description: {
      ja: "茶道は初めて、または基本的なことを学びたい",
      en: "New to tea ceremony or want to learn the basics",
      es: "Nuevo en la ceremonia del té o quiere aprender lo básico",
    },
    icon: "🌱",
  },
  {
    level: "intermediate",
    title: {
      ja: "経験者",
      en: "Intermediate",
      es: "Intermedio",
    },
    description: {
      ja: "茶道の経験があり、より深く学びたい",
      en: "Have some tea ceremony experience and want to learn more",
      es: "Tengo algo de experiencia en la ceremonia del té y quiero aprender más",
    },
    icon: "🍃",
  },
  {
    level: "advanced",
    title: {
      ja: "上級者",
      en: "Advanced",
      es: "Avanzado",
    },
    description: {
      ja: "茶道に精通しており、専門的な知識を求める",
      en: "Well-versed in tea ceremony and seeking expert knowledge",
      es: "Bien versado en la ceremonia del té y busco conocimiento experto",
    },
    icon: "🏯",
  },
];

interface ExperienceSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

export const ExperienceSelection: React.FC<ExperienceSelectionProps> = ({
  onNext,
  onBack,
}) => {
  const { onboardingData, updateExperienceLevel } = useOnboarding();
  const currentLanguage = onboardingData.language;

  const handleExperienceSelect = (level: TeaExperienceLevel) => {
    updateExperienceLevel(level);
  };

  const getTitle = () => {
    switch (currentLanguage) {
      case "ja":
        return "茶道の経験レベルを教えてください";
      case "en":
        return "What's your tea ceremony experience level?";
      case "es":
        return "¿Cuál es tu nivel de experiencia en la ceremonia del té?";
      default:
        return "What's your tea ceremony experience level?";
    }
  };

  const getSubtitle = () => {
    switch (currentLanguage) {
      case "ja":
        return "あなたに最適な解説レベルを提供します";
      case "en":
        return "We'll provide explanations tailored to your level";
      case "es":
        return "Proporcionaremos explicaciones adaptadas a tu nivel";
      default:
        return "We'll provide explanations tailored to your level";
    }
  };

  const getContinueText = () => {
    switch (currentLanguage) {
      case "ja":
        return "完了";
      case "en":
        return "Complete";
      case "es":
        return "Completar";
      default:
        return "Complete";
    }
  };

  const getBackText = () => {
    switch (currentLanguage) {
      case "ja":
        return "戻る";
      case "en":
        return "Back";
      case "es":
        return "Atrás";
      default:
        return "Back";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h1>
          <p className="text-gray-600">{getSubtitle()}</p>
        </div>

        <div className="space-y-4 mb-8">
          {experienceOptions.map((option) => (
            <button
              key={option.level}
              onClick={() => handleExperienceSelect(option.level)}
              className={`w-full p-5 rounded-lg border-2 transition-all duration-200 ${
                onboardingData.experienceLevel === option.level
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-25"
              }`}
            >
              <div className="flex items-start space-x-4">
                <span className="text-3xl mt-1">{option.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 mb-1">
                    {option.title[currentLanguage]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {option.description[currentLanguage]}
                  </div>
                </div>
                {onboardingData.experienceLevel === option.level && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {getBackText()}
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            {getContinueText()}
          </button>
        </div>
      </div>
    </div>
  );
};
