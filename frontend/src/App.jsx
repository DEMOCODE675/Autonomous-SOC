import React, { useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomCardNode from './components/CustomCardNode';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  },
  custom: {
    label: "Custom Raw Telemetry",
    payload: null
  }
};

const baseNodes = [
  { id: 'alert', type: 'customCard', position: { x: 40, y: 40 }, data: { title: 'System Alert', subtitle: 'Data Stream', type: 'system', isActive: false } },
  { id: 'analyzer', type: 'customCard', position: { x: 450, y: 40 }, data: { title: 'Log Analyzer', subtitle: 'Traffic & Metrics', type: 'agent', isActive: false } },
  { id: 'orchestrator', type: 'customCard', position: { x: 245, y: 150 }, data: { title: 'Orchestrator', subtitle: 'Core Workflow Agent', type: 'orchestrator', isActive: false } },
  { id: 'sandbox', type: 'customCard', position: { x: 245, y: 280 }, data: { title: 'Coder Sandbox', subtitle: 'Code Execution Env', type: 'agent', isActive: false } },
  { id: 'vcs', type: 'customCard', position: { x: 500, y: 280 }, data: { title: 'VCS Repository', subtitle: 'Version Control', type: 'system', isActive: false } },
];

const initialEdges = [
  { id: 'e-alert-orch', source: 'alert', sourceHandle: 'right-source', target: 'orchestrator', targetHandle: 'left-target', type: 'smoothstep', animated: true, style: { strokeDasharray: '4 4', stroke: '#94a3b8' } },
  { id: 'e-orch-analyzer', source: 'orchestrator', sourceHandle: 'right-source', target: 'analyzer', targetHandle: 'left-target', label: 'Analyze', type: 'smoothstep', animated: true },
  { id: 'e-analyzer-orch', source: 'analyzer', sourceHandle: 'bottom-source', target: 'orchestrator', targetHandle: 'top-target', label: 'Metric', type: 'smoothstep', animated: true },
  { id: 'e-orch-sandbox', source: 'orchestrator', sourceHandle: 'bottom-source', target: 'sandbox', targetHandle: 'top-target', label: 'Code', type: 'smoothstep', animated: true },
  { id: 'e-sandbox-orch', source: 'sandbox', sourceHandle: 'top-source', target: 'orchestrator', targetHandle: 'bottom-target', label: 'Result', type: 'smoothstep', animated: true },
  { id: 'e-sandbox-vcs', source: 'sandbox', sourceHandle: 'right-source', target: 'vcs', targetHandle: 'left-target', label: 'Commit >', type: 'smoothstep' },
];

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState('ssh');
  const [executionMode, setExecutionMode] = useState('hitl');
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('Idle');
  const [planData, setPlanData] = useState(null);
  const [executionData, setExecutionData] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Custom log inputs
  const [customIp, setCustomIp] = useState('10.0.0.99');
  const [customPort, setCustomPort] = useState(8080);
  const [customProtocol, setCustomProtocol] = useState('TCP');
  const [customLogText, setCustomLogText] = useState('SQL Injection detected: SELECT * FROM users WHERE id=1 OR 1=1 in HTTP payload');

  const nodeTypes = useMemo(() => ({ customCard: CustomCardNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const setNodeActive = (nodeId) => {
    setNodes((prev) =>
      prev.map((n) => ({ ...n, data: { ...n.data, isActive: n.id === nodeId } }))
    );
  };

  const clearActiveNodes = () => {
    setNodes((prev) =>
      prev.map((n) => ({ ...n, data: { ...n.data, isActive: false } }))
    );
  };

  const getPayload = () => {
    if (selectedScenario === 'custom') {
      return {
        source_ip: customIp,
        target_port: Number(customPort) || 0,
        protocol: customProtocol,
        raw_log: customLogText,
      };
    }
    return SCENARIOS[selectedScenario].payload;
  };

  const executeSandboxPhase = async (plan) => {
    setNodeActive('sandbox');
    setStatusText('Executing synthesized mitigation in isolated sandbox...');
    
    const res = await fetch(`${API_BASE}/api/approve-and-execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        triage: plan.triage,
        code: plan.code,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Execution failed in sandbox.');

    setNodeActive('vcs');
    setStatusText('Staging audit record to Git & pushing PR...');
    await new Promise((r) => setTimeout(r, 600));

    setExecutionData(data);
    setStatusText('Incident resolved and verified.');
  };

  const triggerWorkflow = async () => {
    setIsRunning(true);
    setPlanData(null);
    setExecutionData(null);
    setBackendError(null);

    try {
      setNodeActive('alert');
      setStatusText('Ingesting network alert...');
      await new Promise((r) => setTimeout(r, 500));

      setNodeActive('orchestrator');
      setStatusText('Orchestrator triaging security context...');
      await new Promise((r) => setTimeout(r, 500));

      setNodeActive('analyzer');
      setStatusText('Log Analyzer parsing threat with Gemini 3.6 Flash...');

      const res = await fetch(`${API_BASE}/api/plan-mitigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      });

      const plan = await res.json();
      if (!res.ok) throw new Error(plan.detail || 'Triage phase failed.');
      setPlanData(plan);

      if (executionMode === 'hitl') {
        setNodeActive('sandbox');
        setStatusText('Execution paused: Operator sign-off required.');
        setShowApprovalModal(true);
      } else {
        await executeSandboxPhase(plan);
        clearActiveNodes();
        setIsRunning(false);
      }
    } catch (err) {
      setBackendError(err.message);
      setStatusText('Workflow failed.');
      clearActiveNodes();
      setIsRunning(false);
    }
  };

  const handleApprove = async () => {
    setShowApprovalModal(false);
    try {
      await executeSandboxPhase(planData);
    } catch (err) {
      setBackendError(err.message);
      setStatusText('Sandbox execution failed.');
    } finally {
      clearActiveNodes();
      setIsRunning(false);
    }
  };

  const handleReject = () => {
    setShowApprovalModal(false);
    clearActiveNodes();
    setIsRunning(false);
    setStatusText('Mitigation script rejected by human operator. Execution halted.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 relative">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Multi-Agent System Workflow</h1>
            <p className="text-sm text-gray-500">
              Status: <span className="font-mono text-blue-600 font-semibold">{statusText}</span>
            </p>
          </div>

          {/* Right-Hand Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              <button
                type="button"
                disabled={isRunning}
                onClick={() => setExecutionMode('hitl')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  executionMode === 'hitl'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                HITL
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => setExecutionMode('auto')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  executionMode === 'auto'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Auto
              </button>
            </div>

            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={isRunning}
              className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 outline-none cursor-pointer"
            >
              {Object.entries(SCENARIOS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>

            <button
              onClick={triggerWorkflow}
              disabled={isRunning}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm rounded-xl shadow transition-all cursor-pointer whitespace-nowrap"
            >
              {isRunning ? 'Processing...' : 'Trigger Workflow'}
            </button>
          </div>
        </div>

        {/* Custom Threat Ingestion Form */}
        {selectedScenario === 'custom' && (
          <div className="mb-4 p-4 bg-slate-100 border border-slate-300 rounded-2xl">
            <p className="text-xs font-bold text-gray-700 uppercase mb-2">Custom Threat Telemetry Ingestion</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
              <input
                type="text"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                placeholder="Source IP (e.g. 10.0.0.99)"
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono outline-none"
              />
              <input
                type="number"
                value={customPort}
                onChange={(e) => setCustomPort(e.target.value)}
                placeholder="Target Port (e.g. 8080)"
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono outline-none"
              />
              <input
                type="text"
                value={customProtocol}
                onChange={(e) => setCustomProtocol(e.target.value)}
                placeholder="Protocol (TCP/UDP/ICMP)"
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono outline-none"
              />
            </div>
            <textarea
              rows={2}
              value={customLogText}
              onChange={(e) => setCustomLogText(e.target.value)}
              placeholder="Paste raw syslog, firewall warning, or IDS signature here..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono outline-none"
            />
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="w-full h-[380px] border border-gray-100 rounded-2xl bg-white relative">
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

        {/* Backend Error Box */}
        {backendError && (
          <div className="mt-4 p-4 bg-red-950 border border-red-800 text-red-300 font-mono text-xs rounded-xl">
            <p className="font-bold text-red-200 mb-1">Backend Server Error:</p>
            <pre>{backendError}</pre>
          </div>
        )}

        {/* Live Output Section */}
        {(planData || executionData) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {planData && (
              <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs">
                <h3 className="text-blue-400 font-bold mb-2">1. Threat Triage Result</h3>
                <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(planData.triage, null, 2)}
                </pre>
              </div>
            )}

            {executionData && (
              <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-xs">
                <h3 className="text-green-400 font-bold mb-1">2. Sandbox Output:</h3>
                <pre className="text-green-300 bg-black/40 p-2 rounded whitespace-pre-wrap mb-3 max-h-40 overflow-y-auto">
                  {executionData.execution_output || 'Process exited normally.'}
                </pre>
                <h3 className="text-cyan-400 font-bold mb-1">3. VCS Staging Log:</h3>
                <div className="text-cyan-300 bg-black/40 p-2 rounded whitespace-pre-wrap">
                  {executionData.vcs_log?.includes('http') ? (
                    <div>
                      <span>{executionData.vcs_log.split('http')[0]}</span>
                      <a
                        href={`http${executionData.vcs_log.split('http')[1]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline hover:text-blue-300 font-semibold"
                      >
                        View Pull Request on GitHub →
                      </a>
                    </div>
                  ) : (
                    executionData.vcs_log
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HITL Operator Modal */}
      {showApprovalModal && planData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="font-bold text-gray-900 text-base">Human Operator Authorization Required</h2>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold">
                Severity: {planData.triage.severity}/10
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-3 mb-2">
              The Coder Agent synthesized mitigation logic for <strong className="text-gray-900">{planData.triage.threat_type}</strong>. Review and authorize before sandboxed execution:
            </p>

            <div className="bg-gray-950 p-3 rounded-xl max-h-56 overflow-y-auto font-mono text-xs text-yellow-300 mb-4 border border-gray-800">
              <pre className="whitespace-pre-wrap">{planData.code}</pre>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Reject & Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow cursor-pointer"
              >
                Approve & Execute Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}