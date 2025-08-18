import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Play, Flag } from "lucide-react";

type TripStatus = 
  | "DRAFT" 
  | "SUBMITTED" 
  | "HR_REVIEW" 
  | "DRIVER_PENDING" 
  | "SCHEDULED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "REJECTED";

interface TripStatusBadgeProps {
  status: TripStatus;
  size?: "sm" | "md" | "lg";
}

export default function TripStatusBadge({ status, size = "md" }: TripStatusBadgeProps) {
  const getStatusConfig = (status: TripStatus) => {
    switch (status) {
      case "DRAFT":
        return {
          variant: "outline" as const,
          icon: Clock,
          label: "Draft",
          className: "text-muted-foreground"
        };
      case "SUBMITTED":
        return {
          variant: "secondary" as const,
          icon: AlertCircle,
          label: "Submitted",
          className: "text-blue-600 bg-blue-50 border-blue-200"
        };
      case "HR_REVIEW":
        return {
          variant: "secondary" as const,
          icon: Clock,
          label: "HR Review",
          className: "text-orange-600 bg-orange-50 border-orange-200"
        };
      case "DRIVER_PENDING":
        return {
          variant: "secondary" as const,
          icon: AlertCircle,
          label: "Driver Pending",
          className: "text-purple-600 bg-purple-50 border-purple-200"
        };
      case "SCHEDULED":
        return {
          variant: "default" as const,
          icon: Calendar,
          label: "Scheduled",
          className: "text-accent-foreground bg-accent"
        };
      case "IN_PROGRESS":
        return {
          variant: "default" as const,
          icon: Play,
          label: "In Progress",
          className: "text-green-700 bg-green-100 border-green-200"
        };
      case "COMPLETED":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          label: "Completed",
          className: "text-green-600 bg-green-50 border-green-200"
        };
      case "CANCELLED":
        return {
          variant: "secondary" as const,
          icon: XCircle,
          label: "Cancelled",
          className: "text-gray-600 bg-gray-50 border-gray-200"
        };
      case "REJECTED":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Rejected",
          className: ""
        };
      default:
        return {
          variant: "outline" as const,
          icon: Flag,
          label: status,
          className: ""
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClass = {
    sm: "text-xs h-6",
    md: "text-sm h-7",
    lg: "text-base h-8"
  }[size];

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-4 w-4"
  }[size];

  return (
    <Badge 
      variant={config.variant}
      className={`${sizeClass} ${config.className} flex items-center gap-1.5 font-medium`}
    >
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
}