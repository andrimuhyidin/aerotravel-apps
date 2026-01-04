/**
 * Automation Rules Client Component
 * Workflow automation configuration
 */

'use client';

import {
  ArrowRight,
  Bell,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Plus,
  Workflow,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

type AutomationClientProps = {
  locale: string;
};

// Mock data
const AUTOMATION_RULES = [
  {
    id: 1,
    name: 'Booking Confirmation',
    trigger: 'New Booking Created',
    action: 'Send WhatsApp + Email',
    isEnabled: true,
    executions: 1240,
  },
  {
    id: 2,
    name: 'Trip Reminder',
    trigger: '24 hours before trip',
    action: 'Send Reminder to Guest',
    isEnabled: true,
    executions: 856,
  },
  {
    id: 3,
    name: 'Payment Due Alert',
    trigger: '3 days before due date',
    action: 'Notify Finance Team',
    isEnabled: true,
    executions: 342,
  },
  {
    id: 4,
    name: 'Guide Assignment',
    trigger: 'Booking Confirmed',
    action: 'Notify Available Guides',
    isEnabled: false,
    executions: 0,
  },
  {
    id: 5,
    name: 'Feedback Request',
    trigger: 'Trip Completed',
    action: 'Send Feedback Form',
    isEnabled: true,
    executions: 678,
  },
];

const TRIGGER_ICONS: Record<string, typeof Zap> = {
  'New Booking Created': Calendar,
  '24 hours before trip': Clock,
  '3 days before due date': Bell,
  'Booking Confirmed': Zap,
  'Trip Completed': MessageSquare,
};

export function AutomationClient({ locale }: AutomationClientProps) {
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {AUTOMATION_RULES.filter((r) => r.isEnabled).length} Active Rules
          </Badge>
          <Badge variant="secondary">
            {AUTOMATION_RULES.reduce((acc, r) => acc + r.executions, 0).toLocaleString()} Total Executions
          </Badge>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {AUTOMATION_RULES.map((rule) => {
          const TriggerIcon = TRIGGER_ICONS[rule.trigger] || Zap;
          
          return (
            <Card key={rule.id} className={!rule.isEnabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Workflow className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription>
                        {rule.executions.toLocaleString()} executions
                      </CardDescription>
                    </div>
                  </div>
                  <Switch checked={rule.isEnabled} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {/* Trigger */}
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 flex-1">
                    <TriggerIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{rule.trigger}</span>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  
                  {/* Action */}
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 flex-1">
                    {rule.action.includes('WhatsApp') && <MessageSquare className="h-4 w-4 text-green-600" />}
                    {rule.action.includes('Email') && <Mail className="h-4 w-4 text-blue-600" />}
                    {rule.action.includes('Notify') && <Bell className="h-4 w-4 text-orange-600" />}
                    <span className="text-sm">{rule.action}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon Note */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Advanced Automation Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Custom triggers, conditional logic, multi-step workflows, and integration with external services
            will be available in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

