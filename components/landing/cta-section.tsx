"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  BookOpen,
  Mail,
  Phone
} from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main CTA */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Ready to Transform Education?
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Join Thousands of Educators{" "}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Revolutionizing Learning
              </span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Start your journey towards smarter academic management today. 
              Experience the power of AI-driven insights and transform your educational outcomes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/admin">
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
              >
                Schedule Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-blue-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>10,000+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>500+ Institutions</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>98% Satisfaction Rate</span>
              </div>
            </div>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Email Support</h3>
                <p className="text-blue-100 mb-4">Get help from our expert support team</p>
                <a 
                  href="mailto:support@academicms.com" 
                  className="text-yellow-300 hover:text-yellow-200 font-medium transition-colors duration-200"
                >
                  support@academicms.com
                </a>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Phone Support</h3>
                <p className="text-blue-100 mb-4">Speak directly with our specialists</p>
                <a 
                  href="tel:+1-800-ACADEMIC" 
                  className="text-yellow-300 hover:text-yellow-200 font-medium transition-colors duration-200"
                >
                  +1 (800) ACADEMIC
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Message */}
          <div className="text-center mt-16">
            <p className="text-blue-200 text-lg">
              🚀 <strong>Special Launch Offer:</strong> Get 3 months free when you sign up before the end of this month!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}