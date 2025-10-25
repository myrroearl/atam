"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, GraduationCap, Users, BookOpen, Shield } from "lucide-react";
import Link from "next/link";
import { DynamicStats } from "./dynamic-stats";
import { VideoModal } from "./video-modal";

export function HeroSection() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleWatchDemo = () => {
    setIsVideoModalOpen(true);
  };

  return (
    <section className="relative  flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 py-4 sm:py-0">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-lime-400/10 to-green-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="m-24 container mx-auto px-4 relative z-10 h-full flex items-center">
        <div className="max-w-6xl mx-auto text-center w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            AI-Powered Education Platform
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight animate-fade-in-up">
            Transform Education with{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Smart Analytics
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Empower administrators, professors, and students with our AI-enhanced Academic Management System. 
            Track performance, predict outcomes, and unlock educational excellence.
          </p>

          {/* Portal Access Buttons */}
          <div className="mb-3 sm:mb-4 animate-fade-in-up delay-400">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">Access Your Portal</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/professor">
                <Button size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-green-600 hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group w-full sm:w-auto">
                  <Shield className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-200" />
                  Professor Portal
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/student">
                <Button size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl group w-full sm:w-auto">
                  <Users className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-200" />
                  Student Portal
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Demo Button */}
          <div className="animate-fade-in-up delay-600 mb-4 sm:mb-6">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleWatchDemo}
              className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transform hover:scale-105 transition-all duration-200 group w-full sm:w-auto"
            >
              <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" />
              Watch Demo
            </Button>
          </div>

          {/* Dynamic Stats */}
          <div className="mt-6 sm:mt-8 md:mt-10">
            <DynamicStats variant="light" />
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
      />
    </section>
  );
}