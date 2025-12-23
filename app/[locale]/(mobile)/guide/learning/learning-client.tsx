'use client';

/**
 * Learning Hub Client Component
 * Menggabungkan Learning Modules, Assessments, dan Skills dalam satu halaman
 */

import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
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

type TrainingModule = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percent: number;
  };
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
  const [activeTab, setActiveTab] = useState<
    'modules' | 'training' | 'assessments' | 'skills'
  >('modules');
  const [assessmentTab, setAssessmentTab] = useState<'available' | 'history'>(
    'available'
  );
  const [skillsTab, setSkillsTab] = useState<'my-skills' | 'catalog'>(
    'my-skills'
  );

  // Fetch training modules
  const {
    data: trainingData,
    isLoading: trainingLoading,
    error: trainingError,
    refetch: refetchTraining,
  } = useQuery<{
    modules: TrainingModule[];
  }>({
    queryKey: [...queryKeys.guide.all, 'training', 'modules'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/modules');
      if (!res.ok) throw new Error('Failed to fetch training modules');
      return res.json();
    },
    enabled: activeTab === 'training',
  });

  // Fetch available assessments
  const {
    data: availableData,
    isLoading: availableLoading,
    error: availableError,
    refetch: refetchAvailable,
  } = useQuery<{
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
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<{
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
  const {
    data: skillsData,
    isLoading: skillsLoading,
    error: skillsError,
    refetch: refetchSkills,
  } = useQuery<{
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
  const {
    data: catalogData,
    isLoading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useQuery<{
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

  const trainingModules = trainingData?.modules ?? [];
  const availableTemplates = availableData?.templates ?? [];
  const historyAssessments = historyData?.assessments ?? [];
  const mySkills = skillsData?.skills ?? [];
  const catalog = catalogData?.skills ?? [];

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

  const getTrainingStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-slate-400" />;
    }
  };

  const getTrainingStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'in_progress':
        return 'Sedang Dikerjakan';
      default:
        return 'Belum Dimulai';
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger
            value="modules"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
          >
            📚 Materi
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
          >
            🎓 Training
            {trainingModules.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs data-[state=active]:bg-emerald-100">
                {trainingModules.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="assessments"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
          >
            📝 Assessment
            {availableTemplates.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs data-[state=active]:bg-emerald-100">
                {availableTemplates.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-900"
          >
            ⭐ Skills
            {mySkills.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs data-[state=active]:bg-emerald-100">
                {mySkills.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="mt-4 space-y-3">
          {modules.map((module) => (
            <Card key={module.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="mb-1 font-semibold text-slate-900">
                  {module.title}
                </h3>
                <p className="mb-3 text-sm text-slate-600">
                  {module.description}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={module.href}>Buka Materi →</a>
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-blue-50 shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-emerald-900">
                💡 Tips Cepat di Lapangan
              </h3>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="mt-0.5 font-bold text-emerald-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="mt-4 space-y-3">
          {trainingLoading ? (
            <LoadingState
              variant="skeleton-card"
              lines={3}
              message="Memuat modul training..."
            />
          ) : trainingError ? (
            <ErrorState
              message={
                trainingError instanceof Error
                  ? trainingError.message
                  : 'Gagal memuat modul training'
              }
              onRetry={() => void refetchTraining()}
              variant="card"
            />
          ) : trainingModules.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <EmptyState
                  icon={BookOpen}
                  title="Belum ada modul training"
                  description="Modul training akan muncul di sini setelah tersedia"
                  variant="default"
                />
              </CardContent>
            </Card>
          ) : (
            trainingModules.map((module) => {
              if (!module || !module.id) return null;
              const moduleTitle = module.title || 'Training Module';
              const moduleDescription = module.description || '';
              const durationMinutes = module.duration_minutes ?? 0;
              const progressStatus = module.progress?.status;
              const progressPercent = module.progress?.progress_percent ?? 0;

              return (
                <Card key={module.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {moduleTitle}
                        </h3>
                        {moduleDescription && (
                          <p className="mt-1 text-sm text-slate-600">
                            {moduleDescription}
                          </p>
                        )}
                      </div>
                      {getTrainingStatusIcon(progressStatus)}
                    </div>

                    <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{durationMinutes} menit</span>
                      </div>
                      <span className="text-xs">
                        {getTrainingStatusLabel(progressStatus)}
                      </span>
                    </div>

                    {progressStatus === 'in_progress' && (
                      <div className="mb-3">
                        <Progress value={progressPercent} className="h-2" />
                        <div className="mt-1 text-xs text-slate-500">
                          {Math.round(progressPercent)}% selesai
                        </div>
                      </div>
                    )}

                    <Link href={`/${_locale}/guide/training/${module.id}`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        {progressStatus === 'completed'
                          ? 'Lihat Ulang'
                          : 'Mulai Training'}{' '}
                        →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="mt-4 space-y-3">
          <Tabs
            value={assessmentTab}
            onValueChange={(v) => setAssessmentTab(v as typeof assessmentTab)}
          >
            <TabsList className="inline-flex h-auto w-full gap-2 bg-transparent p-0">
              <TabsTrigger
                value="available"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900"
              >
                Tersedia ({availableTemplates.length})
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900"
              >
                Riwayat ({historyAssessments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-3 space-y-3">
              {availableLoading ? (
                <LoadingState variant="skeleton-card" lines={3} />
              ) : availableError ? (
                <ErrorState
                  message={
                    availableError instanceof Error
                      ? availableError.message
                      : 'Gagal memuat assessment'
                  }
                  onRetry={() => void refetchAvailable()}
                  variant="card"
                />
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
                  <Card key={template.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="mt-1 text-sm text-slate-600">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </div>
                      <div className="mb-3 flex items-center gap-4 text-sm text-slate-600">
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
                      <Link
                        href={`/${_locale}/guide/assessments/start/${template.id}`}
                      >
                        <Button className="w-full">Mulai Assessment →</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-3 space-y-3">
              {historyLoading ? (
                <LoadingState variant="skeleton-card" lines={3} />
              ) : historyError ? (
                <ErrorState
                  message={
                    historyError instanceof Error
                      ? historyError.message
                      : 'Gagal memuat riwayat assessment'
                  }
                  onRetry={() => void refetchHistory()}
                  variant="card"
                />
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
                historyAssessments
                  .filter((a) => a && a.id)
                  .map((assessment) => (
                    <Card key={assessment.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {assessment.template?.name || 'Assessment'}
                          </h3>
                          {assessment.status === 'completed' && (
                            <Badge variant="outline" className="text-xs">
                              ✓ Selesai
                            </Badge>
                          )}
                        </div>

                        <div className="mb-3 flex items-center gap-3 text-xs text-slate-600">
                          <span>
                            {assessment.started_at
                              ? (() => {
                                  try {
                                    return new Date(
                                      assessment.started_at
                                    ).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    });
                                  } catch {
                                    return 'Tanggal tidak valid';
                                  }
                                })()
                              : 'Tanggal tidak tersedia'}
                          </span>
                          {assessment.score !== null && (
                            <span
                              className={cn(
                                'font-semibold',
                                getScoreColor(assessment.score)
                              )}
                            >
                              Score: {assessment.score}%
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/${_locale}/guide/assessments/${assessment.id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Lihat Detail →
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-4 space-y-3">
          <Tabs
            value={skillsTab}
            onValueChange={(v) => setSkillsTab(v as typeof skillsTab)}
          >
            <TabsList className="inline-flex h-auto w-full gap-2 bg-transparent p-0">
              <TabsTrigger
                value="my-skills"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-purple-600 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900"
              >
                Skills Saya ({mySkills.length})
              </TabsTrigger>
              <TabsTrigger
                value="catalog"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm data-[state=active]:border-purple-600 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-900"
              >
                Katalog ({catalog.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-skills" className="mt-3 space-y-3">
              {skillsLoading ? (
                <LoadingState variant="skeleton-card" lines={3} />
              ) : skillsError ? (
                <ErrorState
                  message={
                    skillsError instanceof Error
                      ? skillsError.message
                      : 'Gagal memuat skills'
                  }
                  onRetry={() => void refetchSkills()}
                  variant="card"
                />
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
                      if (
                        !skill ||
                        !skill.levels ||
                        !Array.isArray(skill.levels)
                      )
                        return null;
                      const maxLevel = skill.levels.length || 1;
                      const levelProgress =
                        maxLevel > 0
                          ? (guideSkill.current_level / maxLevel) * 100
                          : 0;

                      return (
                        <Card
                          key={guideSkill.id}
                          className="border-0 shadow-sm"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                                {getCategoryIcon(skill.category)}
                              </div>
                              <div className="flex-1">
                                <div className="mb-2 flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold text-slate-900">
                                      {skill.name}
                                    </h3>
                                    {skill.description && (
                                      <p className="mt-0.5 text-sm text-slate-600">
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
                                        'border-amber-500 text-amber-700'
                                    )}
                                  >
                                    {guideSkill.status === 'validated'
                                      ? 'Validated'
                                      : 'Claimed'}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">
                                      Level {guideSkill.current_level} /{' '}
                                      {maxLevel}
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
                                  {skill.levels &&
                                    skill.levels[
                                      guideSkill.current_level - 1
                                    ] && (
                                      <p className="text-xs text-slate-500">
                                        {
                                          skill.levels[
                                            guideSkill.current_level - 1
                                          ]?.description
                                        }
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

            <TabsContent value="catalog" className="mt-3 space-y-3">
              {catalogLoading ? (
                <LoadingState variant="skeleton-card" lines={3} />
              ) : catalogError ? (
                <ErrorState
                  message={
                    catalogError instanceof Error
                      ? catalogError.message
                      : 'Gagal memuat katalog skills'
                  }
                  onRetry={() => void refetchCatalog()}
                  variant="card"
                />
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
                  {catalog
                    .filter((s) => s && s.id && s.name)
                    .map((skill) => {
                      const isClaimed = mySkills.some(
                        (gs) => gs && gs.skill_id === skill.id
                      );
                      const maxLevel =
                        skill.levels && Array.isArray(skill.levels)
                          ? skill.levels.length
                          : 0;

                      return (
                        <Card key={skill.id} className="border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                                {getCategoryIcon(skill.category)}
                              </div>
                              <div className="flex-1">
                                <div className="mb-2 flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold text-slate-900">
                                      {skill.name}
                                    </h3>
                                    {skill.description && (
                                      <p className="mt-0.5 text-sm text-slate-600">
                                        {skill.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline">
                                    {skill.category}
                                  </Badge>
                                </div>
                                <div className="mb-3 text-xs text-slate-500">
                                  {maxLevel} level tersedia
                                </div>
                                {!isClaimed ? (
                                  <Link href={`/${_locale}/guide/skills`}>
                                    <Button
                                      size="sm"
                                      className="w-full sm:w-auto"
                                    >
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
