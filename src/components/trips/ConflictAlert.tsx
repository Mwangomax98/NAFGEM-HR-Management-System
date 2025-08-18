import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Car, User, Wrench } from "lucide-react";

interface Conflict {
  type: "driver" | "vehicle" | "maintenance";
  message: string;
  severity: "warning" | "error";
  suggestions?: string[];
}

interface ConflictAlertProps {
  conflicts: Conflict[];
  onSuggestAlternative?: (type: "driver" | "vehicle") => void;
  onShiftTime?: () => void;
  className?: string;
}

export default function ConflictAlert({ 
  conflicts, 
  onSuggestAlternative, 
  onShiftTime, 
  className 
}: ConflictAlertProps) {
  if (conflicts.length === 0) return null;

  const hasErrors = conflicts.some(c => c.severity === "error");
  const hasWarnings = conflicts.some(c => c.severity === "warning");

  return (
    <Alert className={`${className} ${hasErrors ? 'border-destructive' : 'border-orange-500'}`}>
      <AlertTriangle className={`h-4 w-4 ${hasErrors ? 'text-destructive' : 'text-orange-500'}`} />
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {hasErrors ? 'Conflicts Detected' : 'Potential Issues Found'}
            </span>
            <Badge variant={hasErrors ? "destructive" : "secondary"} className="text-xs">
              {conflicts.length} {conflicts.length === 1 ? 'issue' : 'issues'}
            </Badge>
          </div>

          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-0.5">
                  {conflict.type === "driver" && <User className="h-3 w-3 text-muted-foreground" />}
                  {conflict.type === "vehicle" && <Car className="h-3 w-3 text-muted-foreground" />}
                  {conflict.type === "maintenance" && <Wrench className="h-3 w-3 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{conflict.message}</p>
                  {conflict.suggestions && conflict.suggestions.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {conflict.suggestions.map((suggestion, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(onSuggestAlternative || onShiftTime) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {onSuggestAlternative && conflicts.some(c => c.type === "driver") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onSuggestAlternative("driver")}
                  className="text-xs h-7"
                >
                  <User className="h-3 w-3 mr-1" />
                  Suggest Alternative Driver
                </Button>
              )}
              
              {onSuggestAlternative && conflicts.some(c => c.type === "vehicle") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onSuggestAlternative("vehicle")}
                  className="text-xs h-7"
                >
                  <Car className="h-3 w-3 mr-1" />
                  Suggest Alternative Vehicle
                </Button>
              )}
              
              {onShiftTime && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onShiftTime}
                  className="text-xs h-7"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Shift Time
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}