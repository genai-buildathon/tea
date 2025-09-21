"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { NavProvider } from "@/contexts/NavContext";
import { AdkTestProvider } from "@/contexts/AdkContext";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { Header } from "../components/main/Header";
import { Main } from "../components/main/Main";
import { NavBar } from "../components/main/NavBar";
import { Sidebar } from "@/components/ui/Sidebar";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen relative`}>
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {user ? (
        <AdkTestProvider>
          <SidebarProvider>
            <NavProvider>
              <div className="flex flex-col min-h-screen w-full max-w-md mx-auto relative">
                <Header />
                <Main />
                <NavBar />
                <Sidebar />
              </div>
            </NavProvider>
          </SidebarProvider>
        </AdkTestProvider>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ようこそ</h2>
          <p className="text-gray-600 mb-6">
            Googleアカウントでサインインしてください
          </p>
          <GoogleLoginButton />
        </div>
      )}
    </div>
  );
}
