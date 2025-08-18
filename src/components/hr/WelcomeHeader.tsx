import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import heroImage from "@/assets/hr-hero-image.jpg";

interface WelcomeHeaderProps {
  userName: string;
  userRole: "employee" | "hr" | "admin";
}

export function WelcomeHeader({ userName, userRole }: WelcomeHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleDescription = () => {
    switch (userRole) {
      case "employee":
        return "Manage your tasks, timesheets, and personal HR needs";
      case "hr":
        return "Oversee employee management and HR operations";
      case "admin":
        return "System administration and analytics dashboard";
      default:
        return "Welcome to NAFGEM HR Management System";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-6">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-2 drop-shadow-lg">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-xl text-white font-body drop-shadow-md">
                {getRoleDescription()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-highlight text-lg">{formatTime(currentTime)}</span>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button variant="teal" size="lg">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Reports
              </Button>
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                <Users className="w-5 h-5 mr-2" />
                Quick Actions
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="mt-8 lg:mt-0 lg:ml-8">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">94%</div>
                  <div className="text-sm text-white/80">System Health</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">156</div>
                  <div className="text-sm text-white/80">Active Users</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">12</div>
                  <div className="text-sm text-white/80">Open Tasks</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">85%</div>
                  <div className="text-sm text-white/80">Performance</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}