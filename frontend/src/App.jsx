import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomCardNode from './components/CustomCardNode';
const initialNodes = [
  {
    id: 'alert',
    type: 'customCard',
    position: { x: 50, y: 50 },
    data: { title: 'System Alert', subtitle: 'Data Stream', type: 'system' },
  },
  {
    id: 'analyzer',
    type: 'customCard',
    position: { x: 420, y: 50 },
    data: { title: 'Log Analyzer', subtitle: 'Traffic & Metrics', type: 'agent' },
  },
  {
    id: 'orchestrator',
    type: 'customCard',
    position: { x: 230, y: 150 },
    data: { title: 'Orchestrator', subtitle: 'Core Workflow Agent', type: 'orchestrator' },
  },
  {
    id: 'sandbox',
    type: 'customCard',
    position: { x: 230, y: 280 },
    data: { title: 'Coder Sandbox', subtitle: 'Code Execution Env', type: 'agent' },
  },
  {
    id: 'vcs',
    type: 'customCard',
    position: { x: 480, y: 280 },
    data: { title: 'VCS Repository', subtitle: 'Version Control', type: 'system' },
  },
];

const initialEdges = [
  { id: 'e-alert-orch', source: 'alert', target: 'orchestrator', animated: true, style: { strokeDasharray: '4 4' } },
  { id: 'e-orch-analyzer', source: 'orchestrator', target: 'analyzer', label: 'Analyze', animated: true },
  { id: 'e-analyzer-orch', source: 'analyzer', target: 'orchestrator', label: 'Metric', animated: true },
  { id: 'e-orch-sandbox', source: 'orchestrator', target: 'sandbox', label: 'Code', animated: true },
  { id: 'e-sandbox-orch', source: 'sandbox', target: 'orchestrator', label: 'Result', animated: true },
  { id: 'e-sandbox-vcs', source: 'sandbox', target: 'vcs', label: 'Commit >' },
];

export default function App() {
  const nodeTypes = useMemo(() => ({ customCard: CustomCardNode }), []);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
        <h1 className="text-xl font-bold text-gray-900">Multi-Agent System Workflow</h1>
        <p className="text-sm text-gray-500 mb-6">
          Hover over Orchestrator or Sandbox to highlight the iterative analysis & code execution loop
        </p>

        <div className="w-full h-[450px] border border-gray-100 rounded-2xl bg-white relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={16} size={1} color="#f1f5f9" />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400"></span>
            Orchestrator Node
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-200"></span>
            Specialized Agent
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-gray-400"></span>
            System Environment
          </div>
        </div>
      </div>
    </div>
  );
}