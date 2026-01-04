/**
 * Hook: Booking Draft Management
 * 
 * Features:
 * - Auto-save draft to localStorage (instant)
 * - Debounced save to backend
 * - Load draft from storage
 * - Check for existing drafts
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { logger } from '@/lib/utils/logger';

const DRAFT_STORAGE_KEY = 'booking_draft';
const DEBOUNCE_MS = 5000; // Save to backend every 5 seconds

export type BookingDraft = {
  draftId?: string;
  packageId?: string;
  tripDate?: Date | null;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  adultPax?: number;
  childPax?: number;
  infantPax?: number;
  specialRequests?: string;
  formData?: Record<string, any>;
  lastSaved?: string;
};

export function useBookingDraft() {
  const { partnerId } = usePartnerAuth();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft(parsed);
        logger.info('Draft loaded from localStorage', { draftId: parsed.draftId });
      }
    } catch (error) {
      logger.error('Failed to load draft from localStorage', error);
    }
  }, []);

  // Save draft to localStorage (instant)
  const saveToLocalStorage = useCallback((draftData: BookingDraft) => {
    if (typeof window === 'undefined') return;

    try {
      const dataToSave = {
        ...draftData,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(dataToSave));
      setDraft(dataToSave);
    } catch (error) {
      logger.error('Failed to save draft to localStorage', error);
    }
  }, []);

  // Save draft to backend (debounced)
  const saveToBackend = useCallback(
    async (draftData: BookingDraft) => {
      if (!partnerId) return;

      try {
        setSaving(true);

        const response = await fetch('/api/partner/bookings/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId: draftData.draftId,
            packageId: draftData.packageId,
            tripDate: draftData.tripDate,
            customerId: draftData.customerId,
            customerName: draftData.customerName,
            customerPhone: draftData.customerPhone,
            customerEmail: draftData.customerEmail,
            adultPax: draftData.adultPax,
            childPax: draftData.childPax,
            infantPax: draftData.infantPax,
            specialRequests: draftData.specialRequests,
            formData: draftData.formData,
          }),
        });

        if (response.ok) {
          const { draft: savedDraft } = await response.json();
          // Update draft ID if this was a new draft
          if (!draftData.draftId && savedDraft?.id) {
            const updatedDraft = { ...draftData, draftId: savedDraft.id };
            saveToLocalStorage(updatedDraft);
          }
          logger.info('Draft saved to backend', { draftId: savedDraft?.id });
        }
      } catch (error) {
        logger.error('Failed to save draft to backend', error);
      } finally {
        setSaving(false);
      }
    },
    [partnerId, saveToLocalStorage]
  );

  // Main save function (instant localStorage + debounced backend)
  const saveDraft = useCallback(
    (draftData: BookingDraft) => {
      // Immediate save to localStorage
      saveToLocalStorage(draftData);

      // Debounced save to backend
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveToBackend(draftData);
      }, DEBOUNCE_MS);
    },
    [saveToLocalStorage, saveToBackend]
  );

  // Load draft (already loaded in useEffect, this is for manual reload)
  const loadDraft = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft(parsed);
        return parsed;
      }
    } catch (error) {
      logger.error('Failed to load draft', error);
    }

    return null;
  }, []);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      return !!stored;
    } catch {
      return false;
    }
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(null);
      logger.info('Draft cleared');
    } catch (error) {
      logger.error('Failed to clear draft', error);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    saveDraft,
    loadDraft,
    hasDraft,
    clearDraft,
    saving,
  };
}

