'use client';

import { useCallback, useState } from 'react';
import { SimulationDialog } from './SimulationDialog';

export function SiteFooter() {
  const [simulationOpen, setSimulationOpen] = useState(false);
  const closeSimulation = useCallback(() => setSimulationOpen(false), []);

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>光影工坊</p>
        <button
          type="button"
          className="footer-link"
          onClick={() => setSimulationOpen(true)}
        >
          演示设置
        </button>
      </div>
      <SimulationDialog open={simulationOpen} onClose={closeSimulation} />
    </footer>
  );
}
