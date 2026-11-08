import { create } from 'zustand';

import type { ChartMode } from '../utils/types';

type RunningChartStore = {
  selectedModeByGroup: Record<string, ChartMode>;
  setSelectedMode: (chartId: string, mode: ChartMode) => void;
};

export const useRunningChartStore = create<RunningChartStore>((set) => ({
  selectedModeByGroup: {},
  setSelectedMode: (chartId, mode) =>
    set((state) => ({
      selectedModeByGroup: {
        ...state.selectedModeByGroup,
        [chartId]: mode,
      },
    })),
}));
