"use client";
import React from "react";
import { AdkTestProvider } from "@/contexts/AdkContext";
import { ConnectionPanel } from "./ConnectionPanel";
import { CommunicationTabs } from "./CommunicationTabs";
import { MetadataPanel } from "./MetadataPanel";
import { ClientOnly } from "@/components/common/ClientOnly";
import { useHydration } from "@/hooks/useHydration";

const AdkTestContent: React.FC = () => {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ADK Live Test Frontend
            </h1>
            <p className="text-gray-800">
              ADK（Agent Development
              Kit）のリアルタイム通信機能をテストするためのフロントエンドです
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ADK Live Test Frontend
          </h1>
          <p className="text-gray-800">
            ADK（Agent Development
            Kit）のリアルタイム通信機能をテストするためのフロントエンドです
          </p>
        </div>

        <div className="space-y-8">
          <ConnectionPanel />
          <CommunicationTabs />
          <MetadataPanel />
        </div>
      </div>
    </div>
  );
};

export const AdkTestMain: React.FC = () => {
  return (
    <AdkTestProvider>
      <ClientOnly
        fallback={
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  ADK Live Test Frontend
                </h1>
                <p className="text-gray-800">Loading...</p>
              </div>
            </div>
          </div>
        }
      >
        <AdkTestContent />
      </ClientOnly>
    </AdkTestProvider>
  );
};
