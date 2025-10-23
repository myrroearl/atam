"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            AI-Powered Education Platform
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight animate-fade-in-up">
            Transform Education with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Smart Analytics
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Empower administrators, professors, and students with our AI-enhanced Academic Management System. 
            Track performance, predict outcomes, and unlock educational excellence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up delay-400">
            <Link href="/admin">
              <Button size="lg" className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transform hover:scale-105 transition-all duration-200"
            >
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-in-up delay-600">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">10K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Students Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Professors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}