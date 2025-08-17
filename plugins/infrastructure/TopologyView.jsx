// Topology View Component
import React from 'react';
import { DatacenterCard } from './DatacenterCard';
import { useInfraData } from './data/context';

function TopologyView() {
  const infra = useInfraData();
  const snapshot = infra.getSnapshot();
  // render using snapshot.topology / snapshot.servers
}
const TopologyView = ({ infrastructureByDatacenter, selectedAssets, onAssetToggle, isPlanning, isSimulationRunning, impactedAssets }) => {
  return (
    <div className="space-y-6 overflow-y-auto">
      {Object.entries(infrastructureByDatacenter).map(([dcId, { datacenter, assets }]) => (
        <DatacenterCard 
          key={dcId} 
          datacenter={datacenter} 
          assets={assets}
          selectedAssets={selectedAssets}
          onAssetToggle={onAssetToggle}
          isPlanning={isPlanning}
          isSimulationRunning={isSimulationRunning}
          impactedAssets={impactedAssets}
        />
      ))}
    </div>
  );
};