import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SearchButtonStore {
  showButtonSearch: boolean;
  setShowButtonSearch: (show: boolean) => void;
}

export const useSearchButtonStore = create<SearchButtonStore>()(
  devtools(
    (set) => ({
      showButtonSearch: false,
      setShowButtonSearch: (show) => set({ showButtonSearch: show }),
    }),
    {
      name: 'search-button-store',
    }
  )
);
