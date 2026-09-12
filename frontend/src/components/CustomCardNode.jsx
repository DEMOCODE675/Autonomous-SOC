import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function CustomCardNode({ data }) {
  const isOrchestrator = data.type === 'orchestrator';
  const isActive = data.isActive;

  return (
    <div
      className={`relative px-6 py-3 rounded-2xl border transition-all duration-300 text-center select-none ${
        isActive
          ? 'ring-4 ring-blue-500 border-blue-600 scale-105 shadow-xl bg-blue-50'
          : isOrchestrator
          ? 'bg-blue-100/80 border-blue-400 text-blue-950 shadow-sm'
          : 'bg-gray-100/90 border-gray-300 text-gray-800 shadow-sm'
      }`}
    >
      {/* Top handles */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-transparent !border-0" />

      {/* Bottom handles */}
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-transparent !border-0" />

      {/* Left handles */}
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-transparent !border-0" />

      {/* Right handles */}
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-transparent !border-0" />

      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {data.title}
      </p>
      <p className="text-sm font-medium font-mono text-gray-900 mt-0.5">
        {data.subtitle}
      </p>
    </div>
  );
}