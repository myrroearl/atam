"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github
} from "lucide-react";
import Link from "next/link";

const footerLinks = {
  features: [
    { name: "AI Quiz Generator", href: "#features" },
    { name: "Grade Tracking", href: "#features" },
    { name: "Analytics Dashboard", href: "#features" },
    { name: "Google Integration", href: "#features" }
  ],
  portals: [
    { name: "Student Portal", href: "/student" },
    { name: "Professor Portal", href: "/professor" }
  ],
  project: [
    { name: "About Project", href: "#about" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Documentation", href: "#docs" },
    { name: "GitHub Repository", href: "#github" }
  ],
  contact: [
    { name: "Email Support", href: "mailto:atam@gmail.com" },
    { name: "Phone Support", href: "tel:+639171234567" }
  ]
};

const socialLinks = [
  { name: "GitHub", icon: Github, href: "#", color: "hover:text-gray-400" },
  { name: "LinkedIn", icon: Linkedin, href: "#", color: "hover:text-emerald-600" },
  { name: "Email", icon: Mail, href: "mailto:atam@gmail.com", color: "hover:text-green-600" }
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AcademicMS</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              A comprehensive academic management system developed as a capstone project. 
              Demonstrating modern web technologies and AI integration for educational institutions.
            </p>
            
            {/* Project Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">atam@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">Pamantasan ng Lungsod ng Pasig</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Pasig City, Philippines</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200 ${social.color} hover:bg-gray-700 transform hover:scale-110`}
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Key Features</h3>
              <ul className="space-y-2">
                {footerLinks.features.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Access Portals</h3>
              <ul className="space-y-2">
                {footerLinks.portals.map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Project Info</h3>
              <ul className="space-y-2">
                {footerLinks.project.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2">
                {footerLinks.contact.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      

      {/* Disclaimer Banner */}
      <div className="bg-orange-600 dark:bg-orange-800 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-orange-100 text-sm font-medium">
            ⚠️ <strong>DISCLAIMER:</strong> This is a capstone project for academic purposes only. 
            This is <strong>NOT an official website</strong> of Pamantasan ng Lungsod ng Pasig (PLP).
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <Separator className="bg-gray-800" />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 PLP Academic Management. All rights reserved. Built with ❤️ for educators worldwide.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>⚡Powered by Myrro Milleza, Vincent Enriquez, & Renzel Lagasca</span>
            <span>🚀 99.9% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
}