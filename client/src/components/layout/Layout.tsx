import React from "react";
import Navbar from "@/components/layout/Navbar";
import Navigation from "@/components/layout/Navigation";
import ActionButtons from "@/components/layout/ActionButtons";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Navigation />
      <div className="flex-1 bg-gray-50">
        {children}
      </div>
      <ActionButtons />
    </div>
  );
}
