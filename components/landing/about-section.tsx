"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  Shield, 
  Lightbulb,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const benefits = [
  {
    role: "Students",
    icon: GraduationCap,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    items: [
      "Track your academic progress in real-time",
      "Receive personalized learning recommendations",
      "Compete with peers through gamified leaderboards",
      "Access scholarship opportunities automatically",
      "Practice with AI-powered training modules"
    ]
  },
  {
    role: "Professors",
    icon: Users,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    items: [
      "Monitor class performance with detailed analytics",
      "Identify at-risk students early with AI insights",
      "Streamline grading with automated tools",
      "Integrate seamlessly with Google Classroom",
      "Generate comprehensive performance reports"
    ]
  },
  {
    role: "Administrators",
    icon: Shield,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    items: [
      "Oversee institution-wide academic performance",
      "Make data-driven decisions with predictive analytics",
      "Manage user roles and permissions efficiently",
      "Access comprehensive reporting dashboards",
      "Ensure compliance with educational standards"
    ]
  }
];

export function AboutSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Main About Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left Content */}
            <div>
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                About Our System
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Revolutionizing Academic Management with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Artificial Intelligence
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Our AI-Enhanced Academic Management System transforms traditional education 
                management by combining real-time data analytics, predictive modeling, and 
                intelligent automation to create a comprehensive platform that serves students, 
                professors, and administrators.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Built with modern web technologies and powered by advanced machine learning 
                algorithms, our system provides actionable insights that help educational 
                institutions improve student outcomes and operational efficiency.
              </p>
              
              {/* Key Highlights */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time performance tracking and analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">AI-powered predictive insights and recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Seamless integration with existing educational tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Gamification features to boost student engagement</span>
                </div>
              </div>
            </div>

            {/* Right Content - Visual Element */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 text-center">
                  <Lightbulb className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Innovation at Its Core
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Combining cutting-edge AI technology with user-centered design to create 
                    an educational platform that adapts to your institution's unique needs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits for Each Role */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Tailored Benefits for Every User
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our platform is designed with specific features and benefits for each type of user, 
                ensuring everyone gets maximum value from the system.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg">
                    <CardContent className="p-8">
                      <div className={`w-12 h-12 rounded-lg ${benefit.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`w-6 h-6 ${benefit.color}`} />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        For {benefit.role}
                      </h4>
                      <ul className="space-y-3">
                        {benefit.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}