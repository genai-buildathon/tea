"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelection } from "./LanguageSelection";
import { ExperienceSelection } from "./ExperienceSelection";

type OnboardingStep = "language" | "experience" | "complete";

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("language");
  const { onboardingData, completeOnboarding } = useOnboarding();
  const { setLanguage } = useLanguage();

  const handleLanguageNext = () => {
    // 選択された言語をLanguageContextにも反映
    setLanguage(onboardingData.language);
    setCurrentStep("experience");
  };

  const handleExperienceNext = () => {
    completeOnboarding();
    setCurrentStep("complete");
  };

  const handleExperienceBack = () => {
    setCurrentStep("language");
  };

  const getWelcomeMessage = () => {
    switch (onboardingData.language) {
      case "ja":
        return {
          title: "設定が完了しました！",
          subtitle: "茶道の世界へようこそ",
          description: "あなたの設定に基づいて、最適な体験をお届けします。",
          button: "始める",
        };
      case "en":
        return {
          title: "Setup Complete!",
          subtitle: "Welcome to the world of tea ceremony",
          description:
            "We'll provide you with the best experience based on your preferences.",
          button: "Get Started",
        };
      case "es":
        return {
          title: "¡Configuración Completa!",
          subtitle: "Bienvenido al mundo de la ceremonia del té",
          description:
            "Te proporcionaremos la mejor experiencia basada en tus preferencias.",
          button: "Comenzar",
        };
      default:
        return {
          title: "Setup Complete!",
          subtitle: "Welcome to the world of tea ceremony",
          description:
            "We'll provide you with the best experience based on your preferences.",
          button: "Get Started",
        };
    }
  };

  const renderProgressBar = () => {
    const steps = ["language", "experience"];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <div className="w-full max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= currentIndex
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentIndex ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (currentStep === "complete") {
    const welcomeMessage = getWelcomeMessage();

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-green-50 to-white">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {welcomeMessage.title}
            </h1>
            <h2 className="text-xl text-green-600 mb-4">
              {welcomeMessage.subtitle}
            </h2>
            <p className="text-gray-600 mb-8">{welcomeMessage.description}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              {onboardingData.language === "ja"
                ? "あなたの設定"
                : onboardingData.language === "en"
                ? "Your Settings"
                : "Tu Configuración"}
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {onboardingData.language === "ja"
                    ? "言語:"
                    : onboardingData.language === "en"
                    ? "Language:"
                    : "Idioma:"}
                </span>
                <span className="font-medium">
                  {onboardingData.language === "ja"
                    ? "日本語"
                    : onboardingData.language === "en"
                    ? "English"
                    : "Español"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {onboardingData.language === "ja"
                    ? "経験レベル:"
                    : onboardingData.language === "en"
                    ? "Experience:"
                    : "Experiencia:"}
                </span>
                <span className="font-medium">
                  {onboardingData.language === "ja"
                    ? onboardingData.experienceLevel === "beginner"
                      ? "初心者"
                      : onboardingData.experienceLevel === "intermediate"
                      ? "経験者"
                      : "上級者"
                    : onboardingData.language === "en"
                    ? onboardingData.experienceLevel === "beginner"
                      ? "Beginner"
                      : onboardingData.experienceLevel === "intermediate"
                      ? "Intermediate"
                      : "Advanced"
                    : onboardingData.experienceLevel === "beginner"
                    ? "Principiante"
                    : onboardingData.experienceLevel === "intermediate"
                    ? "Intermedio"
                    : "Avanzado"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              console.log("Onboarding completed, transitioning to main app");
              // リロードではなく、状態の変更により自然にメインアプリに遷移
              // OnboardingContextのisOnboardingCompletedがtrueになることで
              // page.tsxのAuthenticatedAppが自動的にメインアプリを表示する
            }}
            className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            {welcomeMessage.button}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {(currentStep === "language" || currentStep === "experience") && (
        <div className="fixed top-6 left-0 right-0 z-10 px-4">
          {renderProgressBar()}
        </div>
      )}

      {currentStep === "language" && (
        <LanguageSelection onNext={handleLanguageNext} />
      )}

      {currentStep === "experience" && (
        <ExperienceSelection
          onNext={handleExperienceNext}
          onBack={handleExperienceBack}
        />
      )}
    </div>
  );
};
