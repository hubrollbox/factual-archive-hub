import { type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type LucideIcon } from 'lucide-react';

interface ReportBlockAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

interface ReportBlockProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  actions: ReportBlockAction[];
  children?: ReactNode;
  disabled?: boolean;
}

export function ReportBlock({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = 'secondary',
  actions,
  children,
  disabled,
}: ReportBlockProps) {
  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="shrink-0">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant ?? 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || disabled}
                className="gap-2"
              >
                {ActionIcon && <ActionIcon className="h-4 w-4" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
