import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, Clock, BarChart3, Bell, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: Clock,
      title: "Session Tracking",
      description: "Automatically track work sessions with precise login and logout times.",
    },
    {
      icon: BarChart3,
      title: "Productivity Analytics",
      description: "View detailed reports and trends to understand your work patterns.",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description: "Get notified when productivity drops and celebrate improvements.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure admin and employee views with appropriate data access.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="gradient-hero text-sidebar-foreground">
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ProptiWork</span>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="bg-transparent border-sidebar-foreground/30 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            Sign In
          </Button>
        </nav>

        <div className="container mx-auto px-6 py-24 text-center">
          <div className="animate-slide-up">
            <span className="inline-block px-4 py-2 rounded-full bg-sidebar-accent/50 text-sm font-medium mb-6">
              Smart Employee Productivity Monitoring
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Track, Analyze & Optimize
              <br />
              <span className="text-accent">Team Productivity</span>
            </h1>
            <p className="text-xl text-sidebar-foreground/80 max-w-2xl mx-auto mb-10">
              ProptiWork replaces manual attendance and reports with real-time, 
              data-driven insights for modern corporate and hybrid work environments.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-sidebar-foreground/30 text-sidebar-foreground hover:bg-sidebar-accent px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="relative">
          <svg
            className="w-full h-24 fill-background"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C480,100 960,100 1440,0 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Boost Productivity
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for tracking, analyzing, and improving team performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Workspace?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join teams already using ProptiWork to boost productivity and gain valuable insights.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8"
          >
            Start Free Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">ProptiWork</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ProptiWork. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
