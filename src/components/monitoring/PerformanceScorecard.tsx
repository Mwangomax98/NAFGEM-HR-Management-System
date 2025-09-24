import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Star, Medal, TrendingUp, Target, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PerformanceScore {
  category: string;
  score: number;
  maxScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  color: string;
  icon: React.ReactNode;
  description: string;
  recommendations: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  overall_score: number;
  category_scores: PerformanceScore[];
  achievements: string[];
  rank: number;
}

export function PerformanceScorecard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [myScore, setMyScore] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Real data would be calculated from actual KPI and task data
      // For now, we start with empty data
      setTeamMembers([]);
      setMyScore(null);
      
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance scorecard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'bg-accent text-accent-foreground';
      case 'B+':
      case 'B': return 'bg-secondary text-secondary-foreground';
      case 'C+':
      case 'C': return 'bg-yellow-500 text-white';
      default: return 'bg-destructive text-destructive-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-sm border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Performance Scorecard
            </h2>
            <p className="text-muted-foreground">
              Comprehensive performance analysis with scoring and rankings
            </p>
          </div>
        </div>
      </div>

      {/* My Performance Overview */}
      {myScore && (
        <Card className="overflow-hidden bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getRankIcon(myScore.rank)}
                  My Performance Score
                </CardTitle>
                <CardDescription>Your current standing and achievements</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-accent">{myScore.overall_score}</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myScore.category_scores.map((category, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${category.color}`}>
                        {category.icon}
                      </div>
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <Badge className={getGradeColor(category.grade)}>
                      {category.grade}
                    </Badge>
                  </div>
                  
                  <Progress value={(category.score / category.maxScore) * 100} className="h-2" />
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{category.description}</div>
                    <div className="text-xs text-muted-foreground">
                      Score: {category.score}/{category.maxScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <div className="mt-6 p-4 rounded-lg bg-card border border-border/50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                Recent Achievements
              </h4>
              <div className="flex flex-wrap gap-2">
                {myScore.achievements.map((achievement, index) => (
                  <Badge key={index} variant="outline" className="text-accent border-accent/30">
                    {achievement}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Team Performance Leaderboard
          </CardTitle>
          <CardDescription>
            Performance rankings across the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(member.rank)}
                      <span className="font-bold text-lg">#{member.rank}</span>
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent">{member.overall_score}</div>
                      <div className="text-xs text-muted-foreground">Overall Score</div>
                    </div>
                    
                    <div className="flex gap-1">
                      {member.category_scores.map((category, catIndex) => (
                        <div key={catIndex} className="text-center">
                    <Badge className={getGradeColor(category.grade)}>
                      {category.grade}
                    </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {category.category.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Achievements */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.achievements.slice(0, 3).map((achievement, achIndex) => (
                    <Badge key={achIndex} variant="outline" className="text-xs">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      {myScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Action items to improve your performance score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myScore.category_scores.map((category, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={category.color}>
                      {category.icon}
                    </div>
                    <h4 className="font-medium">{category.category}</h4>
                    <Badge className={getGradeColor(category.grade)}>
                      {category.grade}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {category.recommendations.map((rec, recIndex) => (
                      <div key={recIndex} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}