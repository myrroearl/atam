"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  GraduationCap,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

const navItems = [
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" }
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-800" 
        : "bg-transparent"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
              Learnify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Auth Buttons */}
            <Link href="/">
              <Button variant="ghost" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 font-medium px-6">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle Mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-2 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      AcademicMS
                    </span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4 py-6">
                    {navItems.map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 py-2"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex flex-col space-y-4 mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
                    <Link href="/" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full font-medium">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 font-medium">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}