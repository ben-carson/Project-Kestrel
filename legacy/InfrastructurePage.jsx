import React, { useState, useMemo } from 'react';
// ✅ Import the new, specialized stores
// import { useServerStore } from '../../store/useServerStore'; // COMMENTED OUT BY IMPORT FIXER
// import { useSimulationStore } from '../../store/useSimulationStore'; // COMMENTED OUT BY IMPORT FIXER

// Import child components
// import ExecuteConfirmationModal from '../modals/ExecuteConfirmationModal'; // COMMENTED OUT BY IMPORT FIXER
// import SimulationPlanPane from '../infrastructure/SimulationPlanPane'; // COMMENTED OUT BY IMPORT FIXER
// import InventoryView from '../infrastructure/InventoryView'; // COMMENTED OUT BY IMPORT FIXER
// import AnalyticsView from '../infrastructure/AnalyticsView'; // COMMENTED OUT BY IMPORT FIXER
// import AuditTrailView from '../infrastructure/AuditTrailView'; // COMMENTED OUT BY IMPORT FIXER
// import DatacenterCard from '../infrastructure/DatacenterCard'; // COMMENTED OUT BY IMPORT FIXER
// import { SummaryCard } from '../infrastructure/SummaryCard'; // COMMENTED OUT BY IMPORT FIXER
import {
  Map, List, BarChart3, History, Filter, Search,
  Server, Activity, Cpu, AlertTriangle, TrendingUp, Building2
} from 'lucide-react';

export default function InfrastructurePage() {
  // ✅ Get server-related data from useServerStore
  const { serverOverview, datacenters, systemEvents } = useServerStore(state => ({
    serverOverview: state.serverOverview,
    datacenters: state.datacenters,
    systemEvents: state.systemEvents,
  }));
  // ℹ️ NOTE: `recommendations` needs a new home, likely in useServerStore or a new useIntelligenceStore.
  const recommendations = []; // Placeholder

  // ✅ Get simulation-related data from useSimulationStore
  const {
    simulationStatus,
    selectedAssets,
    impactedAssets,
    changeHistory,
    toggleAssetSelection,
    startSimulation,
    resetSimulationState, // Replaces stopSimulation
  } = useSimulationStore(state => ({
    simulationStatus: state.simulationStatus,
    selectedAssets: state.selectedAssets,
    impactedAssets: state.impactedAssets,
    changeHistory: state.changeHistory,
    toggleAssetSelection: state.toggleAssetSelection,
    startSimulation: state.startSimulation,
    resetSimulationState: state.resetSimulationState,
  }));
  const isPlanning = simulationStatus === 'PLANNING';
  const isSimulationRunning = simulationStatus === 'RUNNING' || simulationStatus === 'PENDING';

  const [activeView, setActiveView] = useState('topology');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDatacenter, setSelectedDatacenter] = useState('all');
  const [showConfirm, setShowConfirm] = useState(false);

  // All useMemo hooks below remain the same and now use the new data sources
  const filteredInfrastructure = useMemo(() => {
    return serverOverview?.filter(asset => {
      if (selectedFilter !== 'all' && asset.status !== selectedFilter) return false;
      if (selectedDatacenter !== 'all' && asset.datacenter !== selectedDatacenter) return false;
      if (searchTerm && !asset.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }) || [];
  }, [serverOverview, selectedFilter, selectedDatacenter, searchTerm]);

  const infrastructureByDatacenter = useMemo(() => {
    const grouped = {};
    filteredInfrastructure.forEach(asset => {
      if (!grouped[asset.datacenter]) {
        const dc = datacenters?.find(d => d.id === asset.datacenter);
        grouped[asset.datacenter] = {
          datacenter: dc || { id: asset.datacenter, name: asset.location, provider: 'Unknown' },
          assets: []
        };
      }
      grouped[asset.datacenter].assets.push(asset);
    });
    return grouped;
  }, [filteredInfrastructure, datacenters]);

  const infrastructureSummary = useMemo(() => {
    const total = serverOverview?.length || 0;
    const online = serverOverview?.filter(s => s.status === 'online').length || 0;
    const avgCpu = total > 0 ? serverOverview.reduce((acc, s) => acc + (s.metrics?.cpuUsage || 0), 0) / total : 0;
    const criticalEvents = systemEvents?.filter(e => e.severity === 'critical' && !e.acknowledgedAt).length || 0;
    
    return {
      total,
      online,
      healthScore: total > 0 ? Math.round((online / total) * 100) : 100,
      avgCpu: Math.round(avgCpu),
      criticalEvents,
      activeRecommendations: recommendations?.filter(r => !r.dismissed && !r.implemented).length || 0,
      datacenterCount: datacenters?.length || 0
    };
  }, [serverOverview, systemEvents, recommendations, datacenters]);

  return (
    <>
      <div className={`h-full flex ${isPlanning || isSimulationRunning ? 'pr-96' : ''} transition-all duration-300`}>
        <div className="flex-1 flex flex-col space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Infrastructure Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Unified view of your hybrid cloud infrastructure</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-gray-600 dark:text-gray-400">
                  Simulation: {simulationStatus}
                </span>
              </div>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['topology', 'inventory', 'analytics', 'audit'].map(view => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      activeView === view ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500'
                    }`}
                  >
                    {view === 'topology' && <Map className="w-4 h-4 mr-2" />}
                    {view === 'inventory' && <List className="w-4 h-4 mr-2" />}
                    {view === 'analytics' && <BarChart3 className="w-4 h-4 mr-2" />}
                    {view === 'audit' && <History className="w-4 h-4 mr-2" />}
                    <span className="capitalize">{view}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <SummaryCard title="Total Assets" value={infrastructureSummary.total} icon={Server} color="blue" subtitle="Infrastructure nodes" />
            <SummaryCard title="Health Score" value={`${infrastructureSummary.healthScore}%`} icon={Activity} color="green" subtitle={`${infrastructureSummary.online} online`} />
            <SummaryCard title="Avg CPU" value={`${infrastructureSummary.avgCpu}%`} icon={Cpu} color="yellow" subtitle="Cluster average" />
            <SummaryCard title="Critical Events" value={infrastructureSummary.criticalEvents} icon={AlertTriangle} color="red" />
            <SummaryCard title="Recommendations" value={infrastructureSummary.activeRecommendations} icon={TrendingUp} color="purple" />
            <SummaryCard title="Datacenters" value={infrastructureSummary.datacenterCount} icon={Building2} color="gray" />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
             <div className="flex items-center gap-2 min-w-0 flex-1">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search infrastructure by name, IP, or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} className="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm">
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <select value={selectedDatacenter} onChange={(e) => setSelectedDatacenter(e.target.value)} className="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm">
                <option value="all">All Datacenters</option>
                {(datacenters || []).map(dc => (
				  <option key={dc.id} value={dc.id}>{dc.name}</option>
				))}
              </select>
            </div>
          </div>

          {/* Main Content View */}
          <div className="flex-1 min-h-0">
            {activeView === 'topology' && (
              <div className="space-y-6 overflow-y-auto h-full">
                {Object.entries(infrastructureByDatacenter).map(([dcId, { datacenter, assets }]) => (
                  <DatacenterCard
                    key={dcId}
                    datacenter={datacenter}
                    assets={assets}
                    selectedAssets={selectedAssets}
                    onAssetToggle={toggleAssetSelection}
                    isPlanning={isPlanning}
                    isSimulationRunning={isSimulationRunning}
                    impactedAssets={impactedAssets}
                  />
                ))}
              </div>
            )}
            {activeView === 'inventory' && <InventoryView infrastructure={filteredInfrastructure} selectedAssets={selectedAssets} onAssetToggle={toggleAssetSelection} isPlanning={isPlanning} />}
            {activeView === 'analytics' && <AnalyticsView summary={infrastructureSummary} />}
            {activeView === 'audit' && <AuditTrailView changeHistory={changeHistory} />}
          </div>
        </div>

        {/* Simulation Pane */}
        {(isPlanning || isSimulationRunning) && (
          <SimulationPlanPane
            onStartSimulation={startSimulation}
            onOpenConfirmation={() => setShowConfirm(true)}
            onDiscard={() => resetSimulationState()}
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <ExecuteConfirmationModal
		isOpen={showConfirm}
		onCancel={() => setShowConfirm(false)}
		onConfirm={() => {
			// executePlan(); // This action needs to be defined in useSimulationStore
			alert("Execute Plan action needs to be wired up in useSimulationStore.");
			setShowConfirm(false);
		}}
		onDiscard={() => {
			resetSimulationState();
			setShowConfirm(false);
		}}
	  />
    </>
  );
}
