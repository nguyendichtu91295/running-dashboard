import { Button } from '@douyinfe/semi-ui';

import { t } from '@/shared/i18n';

import { CHART_MODE_OPTIONS } from '../constants/metrics';

import type { ChartMode } from '../utils/types';

type MetricSelectorProps = {
  selectedMode: ChartMode;
  onChange: (mode: ChartMode) => void;
};

export const MetricSelector = ({
  selectedMode,
  onChange,
}: MetricSelectorProps) => (
  <div className="metric-selector" role="tablist" aria-label={t('Chart metric')}>
    {CHART_MODE_OPTIONS.map((mode) => (
      <Button
        aria-selected={selectedMode === mode.key}
        className={selectedMode === mode.key ? 'is-active' : ''}
        key={mode.key}
        onClick={() => onChange(mode.key)}
        role="tab"
        theme={selectedMode === mode.key ? 'solid' : 'borderless'}
        type={selectedMode === mode.key ? 'primary' : 'tertiary'}
      >
        {t(mode.label)}
      </Button>
    ))}
  </div>
);
