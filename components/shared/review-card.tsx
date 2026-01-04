/**
 * Review Card Component
 * Displays a single review with rating and user info
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Star, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

type ReviewCardProps = {
  rating: number;
  review: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
};

export function ReviewCard({ rating, review, createdAt, user }: ReviewCardProps) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{user.name}</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(createdAt), 'd MMM yyyy', { locale: localeId })}
              </span>
            </div>
          </div>
        </div>

        {/* Review Text */}
        <p className="text-sm text-foreground/90 leading-relaxed">{review}</p>
      </CardContent>
    </Card>
  );
}

