"use client";

import React from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface LanguageOption {
  code: "ja" | "en" | "es";
  name: string;
  nativeName: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
];

interface LanguageSelectionProps {
  onNext: () => void;
}

export const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  onNext,
}) => {
  const { onboardingData, updateLanguage } = useOnboarding();

  const handleLanguageSelect = (languageCode: "ja" | "en" | "es") => {
    updateLanguage(languageCode);
  };

  const handleNext = () => {
    onNext();
  };

  const getTitle = () => {
    switch (onboardingData.language) {
      case "ja":
        return "Tea Ceremony Analyzerへようこそ";
      case "en":
        return "Welcome to Tea Ceremony Analyzer";
      case "es":
        return "Bienvenido al Analizador de Ceremonia del Té";
      default:
        return "Welcome to Tea Ceremony Analyzer";
    }
  };

  const getSubtitle = () => {
    switch (onboardingData.language) {
      case "ja":
        return "使用する言語を選択してください";
      case "en":
        return "Please select your preferred language";
      case "es":
        return "Por favor selecciona tu idioma preferido";
      default:
        return "Please select your preferred language";
    }
  };

  const getContinueText = () => {
    switch (onboardingData.language) {
      case "ja":
        return "続ける";
      case "en":
        return "Continue";
      case "es":
        return "Continuar";
      default:
        return "Continue";
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

        <div className="space-y-3 mb-8">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageSelect(option.code)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                onboardingData.language === option.code
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-25"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      {option.nativeName}
                    </div>
                    <div className="text-sm text-gray-600">{option.name}</div>
                  </div>
                </div>
                {onboardingData.language === option.code && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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

        <button
          onClick={handleNext}
          className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          {getContinueText()}
        </button>
      </div>
    </div>
  );
};
