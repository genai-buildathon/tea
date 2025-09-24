"use client";
import React from "react";
import { useNav } from "@/contexts/NavContext";
import { AnalyzerSection } from "../analyzer/AnalyzerSection";
import { HistorySection } from "../history/HistorySection";

export const Main = () => {
  const { activeTab } = useNav();

  return (
    <main className="flex-1 w-full h-full flex flex-col">
      {activeTab === "analyzer" && <AnalyzerSection />}
      {activeTab === "history" && <HistorySection />}
    </main>
  );
};
