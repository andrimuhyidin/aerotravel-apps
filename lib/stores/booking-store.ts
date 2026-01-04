import { create } from 'zustand';

type BookingState = {
  step: number;
  packageId: string | null;
  adultPax: number;
  childPax: number;
  infantPax: number;
  selectedDate: Date | null;
  setStep: (step: number) => void;
  setPackageId: (id: string | null) => void;
  setPax: (adult: number, child: number, infant: number) => void;
  setSelectedDate: (date: Date | null) => void;
  reset: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  step: 1,
  packageId: null,
  adultPax: 0,
  childPax: 0,
  infantPax: 0,
  selectedDate: null,
  setStep: (step) => set({ step }),
  setPackageId: (packageId) => set({ packageId }),
  setPax: (adult, child, infant) =>
    set({ adultPax: adult, childPax: child, infantPax: infant }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  reset: () =>
    set({
      step: 1,
      packageId: null,
      adultPax: 0,
      childPax: 0,
      infantPax: 0,
      selectedDate: null,
    }),
}));

