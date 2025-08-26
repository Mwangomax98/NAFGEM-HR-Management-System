import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KPIGap {
  kpi_id: string;
  title: string;
  project_id: string;
  target_value: number;
  actual_value: number;
  gap_value: number;
  status: string;
  unit: string;
  category: string;
}

interface TaskSuggestion {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  linked_kpi_id: string;
}

interface KPIGapSuggestionsProps {
  onSuggestionSelect: (suggestion: TaskSuggestion) => void;
}

export function KPIGapSuggestions({ onSuggestionSelect }: KPIGapSuggestionsProps) {
  const [gaps, setGaps] = useState<KPIGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGaps();
  }, []);

  const loadGaps = async () => {
    try {
      const { data, error } = await supabase
        .from('kpi_gaps')
        .select('*')
        .neq('status', 'on_track')
        .order('gap_value', { ascending: false })
        .limit(3); // Show top 3 gaps
      
      if (error) throw error;
      setGaps(data || []);
    } catch (error) {
      console.error('Error loading gaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTaskSuggestion = (gap: KPIGap): TaskSuggestion => {
    const suggestions = {
      'operational': `Improve ${gap.title} efficiency and processes`,
      'financial': `Review and optimize ${gap.title} budget allocation`,
      'outcome': `Enhance ${gap.title} service delivery outcomes`,
      'general': `Address ${gap.title} performance shortfall`
    };

    const description = `Work to improve ${gap.title} from ${gap.actual_value}${gap.unit} to ${gap.target_value}${gap.unit}. Current gap: ${gap.gap_value.toFixed(1)}${gap.unit}`;

    return {
      title: suggestions[gap.category as keyof typeof suggestions] || suggestions.general,
      description,
      category: gap.category,
      priority: gap.status === 'gap' ? 'high' : 'medium',
      linked_kpi_id: gap.kpi_id
    };
  };

  if (loading || gaps.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          KPI Gap Suggestions
        </CardTitle>
        <CardDescription>
          Create tasks to address current performance gaps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {gaps.map((gap) => {
            const suggestion = generateTaskSuggestion(gap);
            return (
              <div key={gap.kpi_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-sm">{gap.title}</span>
                    <Badge variant={gap.status === 'gap' ? 'destructive' : 'secondary'}>
                      Gap: {gap.gap_value.toFixed(1)}{gap.unit}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Project: {gap.project_id} • Target: {gap.target_value}{gap.unit} • Actual: {gap.actual_value}{gap.unit}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="ml-3"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Task
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}