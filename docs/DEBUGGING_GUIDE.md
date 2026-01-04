# Debugging Guide - Fitur Baru

## Status Implementasi

### ✅ Components Terintegrasi

1. **RiskTrendChart**
   - File: `components/guide/risk-trend-chart.tsx`
   - Lokasi: `app/[locale]/(mobile)/guide/trips/[slug]/risk-assessment-dialog.tsx`
   - Cara Akses: Trip Detail → Risk Assessment Dialog → Scroll ke bawah

2. **CompetencyQuiz**
   - File: `components/guide/competency-quiz.tsx`
   - Lokasi: `app/[locale]/(mobile)/guide/training/[id]/training-module-detail-client.tsx` (Tab Quiz)
   - Cara Akses: Training → Pilih Module → Tab "Quiz"

3. **TrainerFeedbackForm**
   - File: `components/guide/trainer-feedback-form.tsx`
   - Lokasi: `app/[locale]/(mobile)/guide/training/[id]/training-module-detail-client.tsx` (Tab Feedback)
   - Cara Akses: Training → Pilih Module → Tab "Feedback"

4. **VideoBriefingPlayer**
   - File: `components/guide/video-briefing-player.tsx`
   - Lokasi: `app/[locale]/(mobile)/guide/trips/[slug]/trip-timeline-view.tsx` (Pre-Trip Phase)
   - Cara Akses: Trip Detail → Pre-Trip Phase → Section "Safety Briefing Video"

### ✅ API Endpoints

- `/api/guide/training/modules/[moduleId]/quiz` - Get quiz ID
- `/api/guide/training/quiz/[quizId]` - Get quiz & submit
- `/api/guide/training/[trainingId]/feedback` - Get & submit feedback
- `/api/guide/trips/[id]/briefing/video` - Get video briefing
- `/api/guide/risk/trend` - Get risk trend data

## Troubleshooting

### Jika Web Tidak Bisa Diakses

1. **Cek Server Status**
   ```bash
   ps aux | grep "next dev"
   lsof -ti:3000
   ```

2. **Restart Server**
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

3. **Cek Browser Console**
   - Buka Developer Tools (F12)
   - Cek tab Console untuk error
   - Cek tab Network untuk failed requests

4. **Cek Environment Variables**
   - Pastikan `.env.local` ada dan lengkap
   - Cek `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Cek Database Connection**
   - Pastikan Supabase project aktif
   - Cek apakah migrations sudah dijalankan

### Jika Komponen Tidak Muncul

1. **RiskTrendChart**
   - Pastikan ada trip dengan risk assessments
   - Cek apakah dialog risk assessment terbuka
   - Scroll ke bawah di dalam dialog

2. **CompetencyQuiz**
   - Pastikan training module memiliki quiz
   - Cek tab "Quiz" di training module detail
   - Pastikan API `/api/guide/training/modules/[moduleId]/quiz` return quizId

3. **TrainerFeedbackForm**
   - Cek tab "Feedback" di training module detail
   - Pastikan trainingId valid

4. **VideoBriefingPlayer**
   - Pastikan trip memiliki video briefing
   - Cek di Pre-Trip Phase
   - Pastikan API `/api/guide/trips/[id]/briefing/video` return video data

## Testing Checklist

- [ ] Server running di port 3000
- [ ] Build berhasil tanpa error
- [ ] TypeScript tidak ada error
- [ ] Browser console tidak ada error
- [ ] API endpoints bisa diakses
- [ ] Database migrations sudah dijalankan
- [ ] Environment variables sudah di-set

