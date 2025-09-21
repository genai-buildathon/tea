"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { OnboardingData, TeaExperienceLevel } from "@/types/onboarding";
import { useAuth } from "./AuthContext";

interface OnboardingContextType {
  onboardingData: OnboardingData;
  isOnboardingCompleted: boolean;
  isOnboardingLoading: boolean;
  updateLanguage: (language: "ja" | "en" | "es") => void;
  updateExperienceLevel: (level: TeaExperienceLevel) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

const defaultOnboardingData: OnboardingData = {
  language: "ja",
  experienceLevel: "beginner",
  completed: false,
};

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(
    defaultOnboardingData
  );
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);

  // ユーザーごとのオンボーディング状態をローカルストレージから読み込み
  useEffect(() => {
    if (authLoading) {
      // 認証ローディング中は何もしない
      return;
    }

    if (user?.uid) {
      const savedData = localStorage.getItem(`onboarding_${user.uid}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log("Loaded onboarding data for user:", user.uid, parsedData);
          setOnboardingData(parsedData);
        } catch (error) {
          console.error("Failed to parse onboarding data:", error);
          setOnboardingData(defaultOnboardingData);
        }
      } else {
        // 初回ログインの場合はデフォルトデータを設定
        console.log(
          "No onboarding data found for user:",
          user.uid,
          "using default"
        );
        setOnboardingData(defaultOnboardingData);
      }
      setIsOnboardingLoading(false);
    } else {
      // ユーザーがログインしていない場合
      setOnboardingData(defaultOnboardingData);
      setIsOnboardingLoading(false);
    }
  }, [user?.uid, authLoading]);

  // オンボーディングデータが変更されたときにローカルストレージに保存
  useEffect(() => {
    if (user?.uid && !isOnboardingLoading) {
      const dataToSave = JSON.stringify(onboardingData);
      localStorage.setItem(`onboarding_${user.uid}`, dataToSave);
      console.log("Saved onboarding data for user:", user.uid, onboardingData);

      // 保存後に実際に保存されているかを確認
      const savedCheck = localStorage.getItem(`onboarding_${user.uid}`);
      console.log("Verification - saved data:", savedCheck);
    }
  }, [onboardingData, user?.uid, isOnboardingLoading]);

  const updateLanguage = (language: "ja" | "en" | "es") => {
    console.log("Updating language to:", language);
    setOnboardingData((prev) => ({ ...prev, language }));
  };

  const updateExperienceLevel = (experienceLevel: TeaExperienceLevel) => {
    console.log("Updating experience level to:", experienceLevel);
    setOnboardingData((prev) => ({ ...prev, experienceLevel }));
  };

  const completeOnboarding = () => {
    console.log("Completing onboarding for user:", user?.uid);
    setOnboardingData((prev) => ({ ...prev, completed: true }));
  };

  const resetOnboarding = () => {
    setOnboardingData(defaultOnboardingData);
  };

  // デバッグ用: ローカルストレージの状況を確認
  const debugLocalStorage = () => {
    console.log("=== Local Storage Debug ===");
    console.log("Current user:", user?.uid);
    console.log("Current onboarding data:", onboardingData);
    console.log("Is onboarding completed:", onboardingData.completed);
    console.log("Is onboarding loading:", isOnboardingLoading);

    // 全てのオンボーディング関連のキーを確認
    const keys = Object.keys(localStorage);
    const onboardingKeys = keys.filter((key) => key.startsWith("onboarding_"));
    console.log("All onboarding keys in localStorage:", onboardingKeys);

    onboardingKeys.forEach((key) => {
      const data = localStorage.getItem(key);
      console.log(`${key}:`, data);
    });
    console.log("=== End Debug ===");
  };

  // デバッグ関数をグローバルに公開（開発時のみ）
  if (typeof window !== "undefined") {
    (window as any).debugOnboarding = debugLocalStorage;
  }

  const value: OnboardingContextType = {
    onboardingData,
    isOnboardingCompleted: onboardingData.completed,
    isOnboardingLoading,
    updateLanguage,
    updateExperienceLevel,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
