// src/components/widgets/NetworkTopology/NetworkTopologyContainer.jsx
import React from "react";
import TopologyHeader from './Header/TopologyHeader.jsx';
import ZoomControls from './Header/ZoomControls.jsx';
import NetworkCanvas from './Canvas/NetworkCanvas.jsx';
import Sidebar from './Sidebar/Sidebar.jsx';
import SystemStatusPanel from './BottomPanel/SystemStatusPanel.jsx';
import FloatingMetrics from './Overlays/FloatingMetrics.jsx';
import PredictivePanel from './Overlays/PredictivePanel.jsx';
import NavigationHelp from './Overlays/NavigationHelp.jsx';
import Legend from './Overlays/Legend.jsx';
import { useNetworkData } from './hooks/useNetworkData.js';
import { useEvolutionSystem } from './hooks/useEvolutionSystem.js';
import { useZoomPan } from './hooks/useZoomPan.js';

export default function NetworkTopologyContainer(){
  const data = useNetworkData();
  const evo  = useEvolutionSystem();
  const zoom = useZoomPan();

  return (
    <div className="flex flex-col h-full w-full relative">
      <TopologyHeader meta={data.meta} onFit={() => {
        const nodes = data.nodes ?? [];
        if (!nodes.length) return;
        const xs = nodes.map(n=>n.x), ys = nodes.map(n=>n.y);
        zoom.fit({minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys)}, {width: window.innerWidth, height: window.innerHeight}, 40);
      }}/>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <NetworkCanvas data={data} zoom={zoom} />
          <div className="absolute top-2 right-2"><ZoomControls zoom={zoom} /></div>
          <FloatingMetrics data={data} />
          <PredictivePanel data={data} />
          <NavigationHelp />
          <div className="absolute bottom-2 right-2"><Legend /></div>
        </div>
        <Sidebar data={data} evo={evo} />
      </div>
      <SystemStatusPanel data={data} />
    </div>
  );
}
