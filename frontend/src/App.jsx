import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomCardNode from './components/CustomCardNode';

const SCENARIOS = {
  ssh: {
    label: "SSH Brute Force",
    payload: {
      source_ip: "198.51.100.42",
      target_port: 22,
      protocol: "TCP",
      raw_log: "Failed password for root: 54 attempts in 10 seconds via SSH"
    }
  },
  ddos: {
    label: "SYN Flood (DDoS)",
    payload: {
      source_ip: "203.0.113.195",
      target_port: 443,
      protocol: "TCP",
      raw_log: "SYN packet rate exceeded threshold: 12,000 syn/sec targeting port 443"
    }
  },
  scan: {
    label: "Nmap Reconnaissance Scan",
    payload: {
      source_ip: "45.33.32.156",
      target_port: 0,
      protocol: "TCP",
      raw_log: "Sequential probing across ports 1-1024 with TCP SYN packets"
    }
  }
};

const baseNodes = [
  {
    id: 'alert',
    type: 'customCard',
    position: { x: 40, y: 40 },
    data: { title: 'System Alert', subtitle: 'Data Stream', type: 'system', isActive: false },
  },
  {
    id: 'analyzer',
    type: 'customCard',
    position: { x: 450, y: 40 },
    data: { title: 'Log Analyzer', subtitle: 'Traffic & Metrics', type: 'agent', isActive: false },
  },
  {
    id: 'orchestrator',
    type: 'customCard',
    position: { x: 245, y: 150 },
    data: { title: 'Orchestrator', subtitle: 'Core Workflow Agent', type: 'orchestrator', isActive: false },
  },
  {
    id: 'sandbox',
    type: 'customCard',
    position: { x: 245, y: 280 },
    data: { title: 'Coder Sandbox', subtitle: 'Code Execution Env', type: 'agent', isActive: false },
  },
  {
    id: 'vcs',
    type: 'customCard',
    position: { x: 500, y: 280 },
    data: { title: 'VCS Repository', subtitle: 'Version Control', type: 'system', isActive: false },
  },
];

const initialEdges = [
  {
    id: 'e-alert-orch',
    source: 'alert',
    sourceHandle: 'right-source',
    target: 'orchestrator',
    targetHandle: 'left-target',
    type: 'smoothstep',
    animated: true,
    style: { strokeDasharray: '4 4', stroke: '#94a3b8' },
  },
  {
    id: 'e-orch-analyzer',
    source: 'orchestrator',
    sourceHandle: 'right-source',
    target: 'analyzer',
    targetHandle: 'left-target',
    label: 'Analyze',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'e-analyzer-orch',
    source: 'analyzer',
    sourceHandle: 'bottom-source',
    target: 'orchestrator',
    targetHandle: 'top-target',
    label: 'Metric',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'e-orch-sandbox',
    source: 'orchestrator',
    sourceHandle: 'bottom-source',
    target: 'sandbox',
    targetHandle: 'top-target',
    label: 'Code',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'e-sandbox-orch',
    source: 'sandbox',
    sourceHandle: 'top-source',
    target: 'orchestrator',
    targetHandle: 'bottom-target',
    label: 'Result',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'e-sandbox-vcs',
    source: 'sandbox',
    sourceHandle: 'right-source',
    target: 'vcs',
    targetHandle: 'left-target',
    label: 'Commit >',
    type: 'smoothstep',
  },
];

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState('ssh');
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('Idle');
  const [workflowLogs, setWorkflowLogs] = useState(null);
  const [backendError, setBackendError] = useState(null);

  const nodeTypes = useMemo(() => ({ customCard: CustomCardNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const setNodeActive = (nodeId) => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isActive: node.id === nodeId,
        },
      }))
    );
  };

  const clearActiveNodes = () => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        data: { ...node.data, isActive: false },
      }))
    );
  };

  const triggerWorkflow = async () => {
    setIsRunning(true);
    setWorkflowLogs(null);
    setBackendError(null);

    try {
      setNodeActive('alert');
      setStatusText('Ingesting network alert...');
      await new Promise((r) => setTimeout(r, 600));

      setNodeActive('orchestrator');
      setStatusText('Orchestrator triaging security context...');
      await new Promise((r) => setTimeout(r, 600));

      setNodeActive('analyzer');
      setStatusText('Log Analyzer classifying threat via Gemini 3.6 Flash...');

      const res = await fetch('http://localhost:8000/api/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SCENARIOS[selectedScenario].payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Backend processing error.');
      }

      setNodeActive('sandbox');
      setStatusText('Coder Sandbox executing mitigation script...');
      await new Promise((r) => setTimeout(r, 900));

      setNodeActive('vcs');
      setStatusText('VCS committing audit log...');
      await new Promise((r) => setTimeout(r, 600));

      setWorkflowLogs(data);
      setStatusText('Workflow completed successfully.');
    } catch (err) {
      setBackendError(err.message);
      setStatusText('Workflow failed.');
    } finally {
      clearActiveNodes();
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Multi-Agent System Workflow</h1>
            <p className="text-sm text-gray-500">
              Status: <span className="font-mono text-blue-600 font-semibold">{statusText}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={isRunning}
              className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 outline-none"
            >
              {Object.entries(SCENARIOS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>

            <button
              onClick={triggerWorkflow}
              disabled={isRunning}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm rounded-xl shadow transition-all cursor-pointer"
            >
              {isRunning ? 'Processing...' : 'Trigger Workflow'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="w-full h-[400px] border border-gray-100 rounded-2xl bg-white relative">
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
        <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-400"></span>
            Orchestrator Node
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></span>
            Specialized Agent
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-gray-400"></span>
            System Environment
          </div>
        </div>

        {backendError && (
          <div className="mt-4 p-4 bg-red-950 border border-red-800 text-red-300 font-mono text-xs rounded-xl">
            <p className="font-bold text-red-200 mb-1">Backend Server Error:</p>
            <pre>{backendError}</pre>
          </div>
        )}

        {workflowLogs && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs">
              <h3 className="text-blue-400 font-bold mb-2">1. Threat Triage Result</h3>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(workflowLogs.triage, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs">
              <h3 className="text-yellow-400 font-bold mb-2">2. Generated Python Mitigation</h3>
              <pre className="text-gray-300 max-h-48 overflow-y-auto mb-3 bg-black/40 p-2 rounded whitespace-pre-wrap">
                {workflowLogs.code}
              </pre>
              <h3 className="text-green-400 font-bold mb-1">3. Sandbox Output:</h3>
              <pre className="text-green-300 bg-black/40 p-2 rounded whitespace-pre-wrap">
                {workflowLogs.execution_output || 'Process exited normally.'}
              </pre>
            </div>
            {/* In your terminal logs grid inside App.jsx */}
            <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs">
              <h3 className="text-cyan-400 font-bold mb-1 mt-3">4. VCS Repository Log:</h3>
<pre className="text-cyan-300 bg-black/40 p-2 rounded whitespace-pre-wrap">
  {workflowLogs.vcs_log || 'Awaiting commit...'}
</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}