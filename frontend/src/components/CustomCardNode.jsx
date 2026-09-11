import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function CustomCardNode({ data }) {
  const isOrchestrator = data.type === 'orchestrator';

  return (
    <div
      className={`px-5 py-3 rounded-2xl shadow-sm border transition-all duration-200 text-center select-none ${
        isOrchestrator
          ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-blue-200/50'
          : 'bg-gray-100 border-gray-300 text-gray-800'
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {data.title}
      </p>
      <p className="text-sm font-medium font-mono text-gray-900">
        {data.subtitle}
      </p>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}