"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserPlus, 
  BookOpen, 
  BarChart3, 
  Award,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Sign Up & Setup",
    description: "Create your account and set up your institution's profile. Configure user roles for administrators, professors, and students.",
    features: ["Quick registration process", "Role-based access control", "Institution customization"]
  },
  {
    step: "02",
    icon: BookOpen,
    title: "Import & Integrate",
    description: "Connect with Google Classroom and import existing course data. Set up classes, assignments, and grading criteria.",
    features: ["Google Classroom sync", "Bulk data import", "Custom grading scales"]
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Track & Analyze",
    description: "Monitor student performance in real-time with AI-powered analytics. Get predictive insights and performance recommendations.",
    features: ["Real-time tracking", "AI predictions", "Performance alerts"]
  },
  {
    step: "04",
    icon: Award,
    title: "Optimize & Succeed",
    description: "Use insights to improve teaching strategies, motivate students with leaderboards, and find scholarship opportunities.",
    features: ["Teaching optimization", "Student motivation", "Scholarship matching"]
  }
];

const workflow = [
  {
    role: "Administrator",
    actions: [
      "Sets up institution profile and user management",
      "Configures system-wide settings and permissions",
      "Monitors overall institutional performance",
      "Generates comprehensive reports and analytics"
    ],
    color: "bg-blue-600"
  },
  {
    role: "Professor",
    actions: [
      "Creates and manages course content",
      "Grades assignments and tracks student progress",
      "Reviews AI-generated insights and recommendations",
      "Communicates with students through the platform"
    ],
    color: "bg-indigo-600"
  },
  {
    role: "Student",
    actions: [
      "Views grades and performance analytics",
      "Participates in gamified learning activities",
      "Accesses personalized study recommendations",
      "Explores scholarship opportunities"
    ],
    color: "bg-purple-600"
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-3 py-1">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Four Simple Steps
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our streamlined onboarding process gets your institution up and running 
              with advanced academic management tools in minutes, not hours.
            </p>
          </div>

          {/* Steps Flow */}
          <div className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="relative">
                    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg h-full">
                      <CardContent className="p-6 text-center">
                        {/* Step Number */}
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4 opacity-60">
                          {step.step}
                        </div>
                        
                        {/* Icon */}
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                          {step.description}
                        </p>
                        
                        {/* Features */}
                        <ul className="space-y-2">
                          {step.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    {/* Arrow between steps (hidden on mobile and last item) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ArrowRight className="w-8 h-8 text-blue-300 dark:text-blue-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Workflows */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Tailored Workflows for Every Role
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Each user type has a customized experience designed to maximize their productivity 
                and achieve their specific educational goals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {workflow.map((flow, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className={`w-full h-2 ${flow.color} rounded-full mb-6`}></div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {flow.role} Workflow
                  </h4>
                  <ul className="space-y-3">
                    {flow.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {action}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}