import { IconPulse } from '@douyinfe/semi-icons';
import { Layout } from '@douyinfe/semi-ui';

import { RunningTrendsDashboard } from './features/running-trends/components/RunningTrendsDashboard';
import { t } from './shared/i18n';

export const App = () => (
  <Layout className="app-shell">
    <Layout.Content>
      <main className="app-main">
        <header className="app-header">
          <div className="app-title-lockup">
            <span className="app-icon" aria-hidden="true">
              <IconPulse />
            </span>
            <div>
              <h1>{t('Running Progression')}</h1>
              <p>{t('Distance, heart rate, and pace by workout pattern')}</p>
            </div>
          </div>
        </header>
        <RunningTrendsDashboard />
      </main>
    </Layout.Content>
  </Layout>
);
