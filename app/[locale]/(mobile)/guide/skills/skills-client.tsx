'use client';

/**
 * Skills Client Component
 * Manage guide skills, claim new skills, set goals
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    Plus,
    Target
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type SkillsClientProps = {
  locale: string;
};

type SkillCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_name: string;
  levels: Array<{
    level: number;
    name: string;
    description: string;
  }>;
  validation_method: string;
};

type GuideSkill = {
  id: string;
  skill_id: string;
  current_level: number;
  target_level: number | null;
  status: string;
  validated_at: string | null;
  skill: SkillCatalogItem;
};

type SkillGoal = {
  id: string;
  skill_id: string;
  target_level: number;
  target_date: string | null;
  priority: string;
  status: string;
  current_progress: number;
  skill: SkillCatalogItem;
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'language':
      return '🗣️';
    case 'activity':
      return '🏊';
    case 'safety':
      return '🛡️';
    case 'communication':
      return '💬';
    case 'technical':
      return '📷';
    default:
      return '⭐';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'validated':
      return 'bg-emerald-500';
    case 'claimed':
      return 'bg-amber-500';
    case 'expired':
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
};

export function SkillsClient({ locale: _locale }: SkillsClientProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'my-skills' | 'catalog' | 'goals'>('my-skills');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch guide skills
  const { data: skillsData, isLoading: skillsLoading, error: skillsError, refetch: refetchSkills } = useQuery<{
    skills: GuideSkill[];
  }>({
    queryKey: queryKeys.guide.skills.guide(),
    queryFn: async () => {
      const res = await fetch('/api/guide/skills');
      if (!res.ok) throw new Error('Failed to load skills');
      return (await res.json()) as { skills: GuideSkill[] };
    },
  });

  // Fetch skills catalog
  const { data: catalogData, isLoading: catalogLoading, error: catalogError, refetch: refetchCatalog } = useQuery<{
    skills: SkillCatalogItem[];
  }>({
    queryKey: queryKeys.guide.skills.catalog(),
    queryFn: async () => {
      const res = await fetch('/api/guide/skills/catalog');
      if (!res.ok) throw new Error('Failed to load catalog');
      return (await res.json()) as { skills: SkillCatalogItem[] };
    },
  });

  // Fetch skill goals
  const { data: goalsData, isLoading: goalsLoading, error: goalsError, refetch: refetchGoals } = useQuery<{
    goals: SkillGoal[];
  }>({
    queryKey: queryKeys.guide.skills.goals(),
    queryFn: async () => {
      const res = await fetch('/api/guide/skills/goals');
      if (!res.ok) throw new Error('Failed to load goals');
      return (await res.json()) as { goals: SkillGoal[] };
    },
  });

  // Show error if any query fails
  if (skillsError || catalogError || goalsError) {
    const error = skillsError || catalogError || goalsError;
    const refetch = () => {
      void refetchSkills();
      void refetchCatalog();
      void refetchGoals();
    };
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Gagal memuat data skills'}
        onRetry={refetch}
        variant="card"
      />
    );
  }

  // Claim skill mutation
  const claimMutation = useMutation({
    mutationFn: async ({ skillId, level }: { skillId: string; level: number }) => {
      const res = await fetch('/api/guide/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, level }),
      });
      if (!res.ok) throw new Error('Failed to claim skill');
      return (await res.json()) as { success: boolean; skill: GuideSkill };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.skills.guide() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.skills.catalog() });
    },
  });

  const mySkills = skillsData?.skills ?? [];
  const catalog = catalogData?.skills ?? [];
  const goals = goalsData?.goals ?? [];

  // Filter catalog by category
  const filteredCatalog = selectedCategory
    ? catalog.filter((s) => s.category === selectedCategory)
    : catalog;

  // Get unique categories
  const categories = [...new Set(catalog.map((s) => s.category))];

  const handleClaimSkill = (skillId: string, level: number = 1) => {
    claimMutation.mutate({ skillId, level });
  };

  return (
    <div className="space-y-4 pb-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-skills">
            Skills Saya ({mySkills.length})
          </TabsTrigger>
          <TabsTrigger value="catalog">
            Katalog ({catalog.length})
          </TabsTrigger>
          <TabsTrigger value="goals">
            Goals ({goals.length})
          </TabsTrigger>
        </TabsList>

        {/* My Skills Tab */}
        <TabsContent value="my-skills" className="space-y-4 mt-4">
          {skillsLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <LoadingState variant="skeleton" lines={3} />
              </CardContent>
            </Card>
          ) : mySkills.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <EmptyState
                  icon={Award}
                  title="Belum ada skills"
                  description="Klaim skills dari katalog untuk memulai"
                  variant="default"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mySkills
                .filter((gs) => gs && gs.id && gs.skill)
                .map((guideSkill) => {
                  const skill = guideSkill.skill;
                  if (!skill || !skill.levels || !Array.isArray(skill.levels)) return null;
                  const maxLevel = skill.levels.length || 1;
                  const levelProgress = maxLevel > 0 ? (guideSkill.current_level / maxLevel) * 100 : 0;

                return (
                  <Card key={guideSkill.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                          {getCategoryIcon(skill.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-slate-900">{skill.name}</h3>
                              {skill.description && (
                                <p className="text-sm text-slate-600 mt-0.5">{skill.description}</p>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                guideSkill.status === 'validated' && 'border-emerald-500 text-emerald-700',
                                guideSkill.status === 'claimed' && 'border-amber-500 text-amber-700',
                              )}
                            >
                              {guideSkill.status === 'validated' ? 'Validated' : 'Claimed'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">
                                Level {guideSkill.current_level} / {maxLevel}
                              </span>
                              {guideSkill.target_level && (
                                <span className="text-slate-500">
                                  Target: Level {guideSkill.target_level}
                                </span>
                              )}
                            </div>
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-emerald-600 transition-all duration-300"
                                style={{ width: `${levelProgress}%` }}
                              />
                            </div>
                            {skill.levels && skill.levels[guideSkill.current_level - 1] && (
                              <p className="text-xs text-slate-500">
                                {skill.levels[guideSkill.current_level - 1]?.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4 mt-4">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Semua
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}

          {catalogLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <LoadingState variant="skeleton" lines={3} />
              </CardContent>
            </Card>
          ) : filteredCatalog.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <EmptyState
                  icon={Award}
                  title="Tidak ada skills tersedia"
                  description="Skills akan muncul di sini"
                  variant="default"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCatalog
                .filter((s) => s && s.id && s.name)
                .map((skill) => {
                  const isClaimed = mySkills.some((gs) => gs && gs.skill_id === skill.id);
                  const maxLevel = skill.levels && Array.isArray(skill.levels) ? skill.levels.length : 0;

                return (
                  <Card key={skill.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                          {getCategoryIcon(skill.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-slate-900">{skill.name}</h3>
                              {skill.description && (
                                <p className="text-sm text-slate-600 mt-0.5">{skill.description}</p>
                              )}
                            </div>
                            <Badge variant="outline">{skill.category}</Badge>
                          </div>
                          <div className="text-xs text-slate-500 mb-3">
                            {maxLevel} level tersedia
                          </div>
                          {!isClaimed ? (
                            <Button
                              size="sm"
                              onClick={() => handleClaimSkill(skill.id, 1)}
                              disabled={claimMutation.isPending}
                              className="w-full sm:w-auto"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Klaim Skill
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Sudah diklaim
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4 mt-4">
          {goalsLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <LoadingState variant="skeleton" lines={3} />
              </CardContent>
            </Card>
          ) : goals.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <EmptyState
                  icon={Target}
                  title="Belum ada goals"
                  description="Buat goal untuk meningkatkan skills Anda"
                  variant="default"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {goals
                .filter((g) => g && g.id && g.skill)
                .map((goal) => {
                  const skill = goal.skill;
                  if (!skill || !skill.id) return null;
                return (
                  <Card key={goal.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                          {getCategoryIcon(skill.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-slate-900">{skill.name}</h3>
                              <p className="text-sm text-slate-600 mt-0.5">
                                Target: Level {goal.target_level}
                              </p>
                            </div>
                            <Badge
                              variant={
                                goal.status === 'completed' ? 'default' :
                                goal.status === 'active' ? 'secondary' :
                                'outline'
                              }
                            >
                              {goal.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Progress</span>
                              <span className="font-semibold text-slate-900">{goal.current_progress}%</span>
                            </div>
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${goal.current_progress}%` }}
                              />
                            </div>
                            {goal.target_date && (
                              <p className="text-xs text-slate-500">
                                Target:{' '}
                                {(() => {
                                  try {
                                    return new Date(goal.target_date).toLocaleDateString('id-ID');
                                  } catch {
                                    return 'Tanggal tidak valid';
                                  }
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
