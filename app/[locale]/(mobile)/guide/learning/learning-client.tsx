'use client';

/**
 * Learning Hub Client Component
 * Menggabungkan Learning Modules, Assessments, dan Skills dalam satu halaman
 */

import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type LearningClientProps = {
  locale: string;
};

type AssessmentTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  assessment_type: string;
  estimated_minutes: number | null;
  passing_score: number | null;
};

type Assessment = {
  id: string;
  template_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  category: string | null;
  status: string;
  template?: AssessmentTemplate;
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

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'self_assessment':
      return 'Self Assessment';
    case 'performance_review':
      return 'Performance Review';
    case 'skills_evaluation':
      return 'Skills Evaluation';
    default:
      return category;
  }
};

const getScoreColor = (score: number | null) => {
  if (score === null) return 'text-slate-500';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

export function LearningClient({ locale: _locale }: LearningClientProps) {
  const [activeTab, setActiveTab] = useState<'modules' | 'assessments' | 'skills'>('modules');
  const [assessmentTab, setAssessmentTab] = useState<'available' | 'history'>('available');
  const [skillsTab, setSkillsTab] = useState<'my-skills' | 'catalog'>('my-skills');

  // Fetch available assessments
  const { data: availableData, isLoading: availableLoading } = useQuery<{
    templates: AssessmentTemplate[];
  }>({
    queryKey: queryKeys.guide.assessments.available(),
    queryFn: async () => {
      const res = await fetch('/api/guide/assessments/available');
      if (!res.ok) throw new Error('Failed to load assessments');
      return (await res.json()) as { templates: AssessmentTemplate[] };
    },
    enabled: activeTab === 'assessments',
  });

  // Fetch assessment history
  const { data: historyData, isLoading: historyLoading } = useQuery<{
    assessments: Assessment[];
    total: number;
  }>({
    queryKey: queryKeys.guide.assessments.history(),
    queryFn: async () => {
      const res = await fetch('/api/guide/assessments/history?limit=20');
      if (!res.ok) throw new Error('Failed to load history');
      return (await res.json()) as { assessments: Assessment[]; total: number };
    },
    enabled: activeTab === 'assessments',
  });

  // Fetch guide skills
  const { data: skillsData, isLoading: skillsLoading } = useQuery<{
    skills: GuideSkill[];
  }>({
    queryKey: queryKeys.guide.skills.guide(),
    queryFn: async () => {
      const res = await fetch('/api/guide/skills');
      if (!res.ok) throw new Error('Failed to load skills');
      return (await res.json()) as { skills: GuideSkill[] };
    },
    enabled: activeTab === 'skills',
  });

  // Fetch skills catalog
  const { data: catalogData, isLoading: catalogLoading } = useQuery<{
    skills: SkillCatalogItem[];
  }>({
    queryKey: queryKeys.guide.skills.catalog(),
    queryFn: async () => {
      const res = await fetch('/api/guide/skills/catalog');
      if (!res.ok) throw new Error('Failed to load catalog');
      return (await res.json()) as { skills: SkillCatalogItem[] };
    },
    enabled: activeTab === 'skills' && skillsTab === 'catalog',
  });

  const availableTemplates = availableData?.templates || [];
  const historyAssessments = historyData?.assessments || [];
  const mySkills = skillsData?.skills || [];
  const catalog = catalogData?.skills || [];

  const modules = [
    {
      title: 'Dasar Penggunaan Guide App',
      description:
        'Langkah-langkah utama dari login, cek trip, attendance, hingga upload dokumentasi.',
      href: `/${_locale}/help#faq`,
    },
    {
      title: 'SOP Safety & Emergency',
      description:
        'Ringkasan SOP keselamatan, penggunaan life jacket, dan prosedur tombol SOS.',
      href: `/${_locale}/help#faq`,
    },
    {
      title: 'Best Practice Dokumentasi Trip',
      description:
        'Tips foto/video yang dibutuhkan untuk payroll dan promosi, serta cara upload yang benar.',
      href: `/${_locale}/help#faq`,
    },
  ];

  const tips = [
    'Selalu cek cuaca dan kondisi peralatan sebelum berangkat.',
    'Gunakan fitur attendance dan manifest secara real-time untuk menghindari miss counting.',
    'Segera laporkan insiden melalui Formulir Insiden agar terekam di sistem.',
    'Manfaatkan halaman Wallet untuk memantau pendapatan dan target pribadi.',
  ];

  return (
    <div className="space-y-4 pb-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Materi</TabsTrigger>
          <TabsTrigger value="assessments">
            Assessment ({availableTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="skills">Skills ({mySkills.length})</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          <div className="space-y-3">
            {modules.map((module) => (
              <Card key={module.title} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-slate-600">{module.description}</p>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a href={module.href}>Buka Materi</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 bg-emerald-50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-800">Tips Cepat di Lapangan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-4 text-sm text-emerald-900">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4 mt-4">
          <Tabs value={assessmentTab} onValueChange={(v) => setAssessmentTab(v as typeof assessmentTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">
                Tersedia ({availableTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                Riwayat ({historyAssessments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4 mt-4">
              {availableLoading ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <LoadingState variant="skeleton" lines={3} />
                  </CardContent>
                </Card>
              ) : availableTemplates.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12">
                    <EmptyState
                      icon={FileText}
                      title="Tidak ada assessment tersedia"
                      description="Semua assessment yang tersedia akan muncul di sini"
                      variant="default"
                    />
                  </CardContent>
                </Card>
              ) : (
                availableTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                          {template.description && (
                            <p className="text-sm text-slate-600">{template.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                        {template.estimated_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{template.estimated_minutes} menit</span>
                          </div>
                        )}
                        {template.passing_score && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Pass: {template.passing_score}%</span>
                          </div>
                        )}
                      </div>
                      <Link href={`/${_locale}/guide/assessments/start/${template.id}`}>
                        <Button className="w-full">Mulai Assessment</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              {historyLoading ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <LoadingState variant="skeleton" lines={3} />
                  </CardContent>
                </Card>
              ) : historyAssessments.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-12">
                    <EmptyState
                      icon={FileText}
                      title="Belum ada assessment"
                      description="Mulai assessment pertama Anda untuk melihat riwayat di sini"
                      variant="default"
                    />
                  </CardContent>
                </Card>
              ) : (
                historyAssessments.map((assessment) => (
                  <Card key={assessment.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">
                              {assessment.template?.name || 'Assessment'}
                            </h3>
                            {assessment.status === 'completed' && (
                              <Badge variant="outline" className="text-xs">Selesai</Badge>
                            )}
                          </div>
                          {assessment.template?.description && (
                            <p className="text-sm text-slate-600 mb-2">
                              {assessment.template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>
                              {new Date(assessment.started_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {assessment.score !== null && (
                              <span
                                className={cn('font-semibold', getScoreColor(assessment.score))}
                              >
                                Score: {assessment.score}%
                              </span>
                            )}
                            {assessment.category && (
                              <Badge variant="secondary" className="text-xs">
                                {assessment.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link href={`/${_locale}/guide/assessments/${assessment.id}`}>
                          <Button variant="ghost" size="sm">
                            Lihat
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4 mt-4">
          <Tabs value={skillsTab} onValueChange={(v) => setSkillsTab(v as typeof skillsTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-skills">
                Skills Saya ({mySkills.length})
              </TabsTrigger>
              <TabsTrigger value="catalog">
                Katalog ({catalog.length})
              </TabsTrigger>
            </TabsList>

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
                  {mySkills.map((guideSkill) => {
                    const skill = guideSkill.skill;
                    const maxLevel = skill.levels.length;
                    const levelProgress = (guideSkill.current_level / maxLevel) * 100;

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
                                    <p className="text-sm text-slate-600 mt-0.5">
                                      {skill.description}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    guideSkill.status === 'validated' &&
                                      'border-emerald-500 text-emerald-700',
                                    guideSkill.status === 'claimed' &&
                                      'border-amber-500 text-amber-700',
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
                                {skill.levels[guideSkill.current_level - 1] && (
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

            <TabsContent value="catalog" className="space-y-4 mt-4">
              {catalogLoading ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <LoadingState variant="skeleton" lines={3} />
                  </CardContent>
                </Card>
              ) : catalog.length === 0 ? (
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
                  {catalog.map((skill) => {
                    const isClaimed = mySkills.some((gs) => gs.skill_id === skill.id);
                    const maxLevel = skill.levels.length;

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
                                    <p className="text-sm text-slate-600 mt-0.5">
                                      {skill.description}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline">{skill.category}</Badge>
                              </div>
                              <div className="text-xs text-slate-500 mb-3">
                                {maxLevel} level tersedia
                              </div>
                              {!isClaimed ? (
                                <Link href={`/${_locale}/guide/skills`}>
                                  <Button size="sm" className="w-full sm:w-auto">
                                    Klaim Skill
                                  </Button>
                                </Link>
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
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
