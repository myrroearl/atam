"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Brain, 
  Trophy, 
  BookOpen, 
  Award, 
  Target,
  Zap,
  Users,
  TrendingUp,
  FileText,
  Presentation,
  ClipboardList,
  Calendar,
  MessageSquare,
  Settings,
  Shield,
  GraduationCap,
  Sparkles,
  Database,
  Globe,
  Lock
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-time Grade Tracking",
    description: "Monitor student performance with live updates, comprehensive analytics, and instant notifications for grade changes.",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  {
    icon: Brain,
    title: "AI-Powered Analytics",
    description: "Leverage machine learning to predict student outcomes, identify at-risk learners, and optimize teaching strategies.",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
  },
  {
    icon: FileText,
    title: "AI Quiz Generator",
    description: "Generate intelligent quizzes with multiple choice, true/false, and short answer questions using advanced AI technology.",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30"
  },
  {
    icon: Presentation,
    title: "AI Presentation Creator",
    description: "Create stunning presentations automatically with AI-generated content, templates, and smart slide management.",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30"
  },
  {
    icon: BookOpen,
    title: "Google Classroom Integration",
    description: "Seamlessly connect with Google Classroom for automated assignment syncing and grade management.",
    color: "text-lime-600 dark:text-lime-400",
    bgColor: "bg-lime-100 dark:bg-lime-900/30"
  },
  {
    icon: Users,
    title: "Multi-Role Dashboard",
    description: "Tailored interfaces for administrators, professors, and students with role-specific features and permissions.",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  {
    icon: Settings,
    title: "Comprehensive Management",
    description: "Manage classes, sections, users, and academic resources with powerful administrative tools and controls.",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
  },
  {
    icon: Trophy,
    title: "Gamified Leaderboards",
    description: "Motivate students with competitive leaderboards, achievement badges, and progress tracking systems.",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30"
  },
  {
    icon: Award,
    title: "Learning Resource Recommendations",
    description: "AI-driven learning resource recommendations based on student performance, interests, and academic achievements.",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30"
  },
  {
    icon: Target,
    title: "Training Modules",
    description: "Interactive learning modules and practice exercises to help students improve their academic performance.",
    color: "text-lime-600 dark:text-lime-400",
    bgColor: "bg-lime-100 dark:bg-lime-900/30"
  },
  {
    icon: Database,
    title: "Learning Resources",
    description: "Access a comprehensive library of educational materials, videos, and resources curated by AI algorithms.",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  {
    icon: Shield,
    title: "Activity Logging",
    description: "Comprehensive audit trails and activity logging for security, compliance, and system monitoring.",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30"
  }
];

const stats = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second response times for all analytics and reporting features.",
    color: "text-green-600 dark:text-green-400"
  },
  {
    icon: Users,
    title: "Multi-Role Support",
    description: "Tailored interfaces for administrators, professors, and students.",
    color: "text-emerald-600 dark:text-emerald-400"
  },
  {
    icon: TrendingUp,
    title: "Predictive Insights",
    description: "Advanced algorithms predict student success with 98% accuracy.",
    color: "text-teal-600 dark:text-teal-400"
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Powerful Features for{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Modern Education
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Our comprehensive platform combines cutting-edge AI technology with intuitive design 
            to revolutionize how educational institutions manage and track academic performance.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Built for Performance & Scale
            </h3>
            <p className="text-green-100 text-lg">
              Experience the difference with our enterprise-grade platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">{stat.title}</h4>
                  <p className="text-green-100">{stat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}