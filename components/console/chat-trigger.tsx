/**
 * Chat Trigger Button for Header
 * Shows unread count badge and opens unified chat panel
 */

'use client';

import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ChatPanel } from './chat-panel';

type ChatTriggerProps = {
  locale: string;
};

export function ChatTrigger({ locale }: ChatTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // TODO: Get real unread count from real-time subscription
  const unreadCount = 0;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
              aria-label="Open chat"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Messages</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        locale={locale}
      />
    </>
  );
}

