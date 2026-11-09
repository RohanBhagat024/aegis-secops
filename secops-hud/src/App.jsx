import { useState, useMemo, useRef } from 'react'
import axios from 'axios'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Grid } from '@react-three/drei'
import {
  Shield, ShieldAlert, Search, Terminal, Cpu,
  Activity, Server, CheckCircle2, AlertTriangle, Play
} from 'lucide-react'

// --- SUBTLE 3D NETWORK TOPOLOGY ---
function HostCore() {
  const ringRef = useRef()

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.25
    }
  })

  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.65, 64]} />
        <meshBasicMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

function PortNode({ position, portData, finding }) {
  const sev = (finding?.severity || 'Low').toLowerCase()
  const color = sev === 'high' || sev === 'critical'
    ? '#ef4444'
    : sev === 'medium'
      ? '#f59e0b'
      : '#10b981'

  const lineGeometry = useMemo(() => {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...position)]
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [position])

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.45} />
      </line>

      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.2} />
        </mesh>

        <Html position={[0, 0.48, 0]} center distanceFactor={9}>
          <div className="node-pill">
            <span className="node-dot" style={{ background: color }} />
            <span className="node-port">{portData.port}</span>
            <span className="node-svc">{portData.service}</span>
          </div>
        </Html>
      </group>
    </group>
  )
}

function TopologyScene({ report, target }) {
  const ports = report?.scan_data?.open_ports || []
  const findings = report?.ai_analysis?.findings || []

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[8, 8, 8]} intensity={1.2} />
      <OrbitControls
        enableZoom={true}
        autoRotate
        autoRotateSpeed={0.45}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={4}
        maxDistance={12}
      />

      <Grid
        infiniteGrid
        fadeDistance={22}
        sectionColor="#1e293b"
        cellColor="#0f172a"
        sectionSize={3}
        cellSize={1}
        position={[0, -1.4, 0]}
      />

      <HostCore />

      <Html position={[0, -0.95, 0]} center>
        <div className="host-label">{target}</div>
      </Html>

      {ports.map((p, idx) => {
        const angle = (idx / Math.max(ports.length, 1)) * Math.PI * 2 + 0.5
        const radius = 2.8
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const finding = findings.find(f => Number(f.port) === Number(p.port))

        return (
          <PortNode
            key={p.port}
            position={[x, 0, z]}
            portData={p}
            finding={finding}
          />
        )
      })}
    </>
  )
}

// --- INITIAL SAMPLE DATA ---
const INITIAL_REPORT = {
  target: '127.0.0.1',
  scan_data: {
    target: '127.0.0.1',
    status: 'up',
    open_ports: [
      { port: 8000, protocol: 'tcp', service: 'http', product: 'Uvicorn', version: '0.30' },
      { port: 8080, protocol: 'tcp', service: 'http', product: 'SimpleHTTPServer', version: '0.6' }
    ]
  },
  ai_analysis: {
    summary: 'Host 127.0.0.1 exposes two unencrypted HTTP development servers on ports 8000 and 8080 without TLS termination or access control.',
    risk_level: 'Medium',
    findings: [
      {
        port: 8080,
        service: 'http (SimpleHTTPServer)',
        vulnerability: 'Python SimpleHTTPServer exposes directory listings and lacks authentication headers.',
        severity: 'High',
        remediation: 'kill -9 $(lsof -t -i:8080) && sudo ufw deny 8080/tcp'
      },
      {
        port: 8000,
        service: 'http (Uvicorn)',
        vulnerability: 'ASGI endpoint is directly accessible without a reverse proxy or rate-limiting policy.',
        severity: 'Medium',
        remediation: 'Bind Uvicorn to 127.0.0.1 and proxy traffic through Nginx with TLS.'
      }
    ]
  }
}

export default function App() {
  const [target, setTarget] = useState('127.0.0.1')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(100)
  const [statusText, setStatusText] = useState('Audit Complete')
  const [report, setReport] = useState(INITIAL_REPORT)
  const [logs, setLogs] = useState([
    { time: '14:02:11', step: 'INIT', msg: 'SecOps Engine ready on local interface' },
    { time: '14:02:14', step: 'NMAP', msg: 'Scanned 127.0.0.1 — discovered 2 active TCP services' },
    { time: '14:02:18', step: 'LLM', msg: 'Ollama inference completed structured threat report' }
  ])

  const appendLog = (step, msg) => {
    const time = new Date().toLocaleTimeString([], { hour12: false })
    setLogs(prev => [...prev.slice(-6), { time, step, msg }])
  }

  const runScan = async (e) => {
    e?.preventDefault()
    if (!target.trim() || loading) return

    setLoading(true)
    setProgress(12)
    setStatusText('Running Nmap Discovery...')
    appendLog('NMAP', `Starting service scan against ${target}...`)

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev === 36) {
          setStatusText('Parsing Open Ports & Headers...')
          appendLog('PARSE', 'Extracting service banners into JSON payload...')
        }
        if (prev === 68) {
          setStatusText('Running Local Ollama Analysis...')
          appendLog('LLM', 'Evaluating CVEs and remediation steps via Ollama...')
        }
        return prev >= 92 ? 92 : prev + 8
      })
    }, 350)

    try {
      const response = await axios.post('http://localhost:8000/api/scan', { target })
      clearInterval(timer)
      setProgress(100)
      setStatusText('Audit Complete')
      setReport(response.data)
      const count = response.data?.scan_data?.open_ports?.length || 0
      appendLog('DONE', `Audit finished: ${count} open ports analyzed.`)
    } catch (err) {
      clearInterval(timer)
      setProgress(100)
      setStatusText('Backend Offline (Showing Cached Report)')
      appendLog('WARN', 'Could not reach localhost:8000 — showing cached report.')
    }
    setLoading(false)
  }

  const openPorts = report?.scan_data?.open_ports || []
  const findings = report?.ai_analysis?.findings || []
  const riskLevel = report?.ai_analysis?.risk_level || 'Low'

  const getBadgeStyle = (sev = 'Low') => {
    const s = sev.toLowerCase()
    if (s === 'high' || s === 'critical') {
      return { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
    }
    if (s === 'medium') {
      return { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' }
    }
    return { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
  }

  const riskBadge = getBadgeStyle(riskLevel)

  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root {
          width: 100%;
          min-height: 100vh;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #090d16 !important;
          color: #f1f5f9 !important;
          font-family: 'Inter', -apple-system, sans-serif !important;
          text-align: left !important;
        }

        .app-shell {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Top Navigation Bar */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 16px 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
        }

        .brand-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #f8fafc;
        }

        .brand-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Search & Action Bar */
        .search-form {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0b1120;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 8px 14px;
          width: 280px;
          transition: border-color 0.2s;
        }

        .input-wrap:focus-within {
          border-color: #3b82f6;
        }

        .target-input {
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          width: 100%;
        }

        .primary-btn {
          background: #2563eb;
           hover: #1d4ed8;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s ease, transform 0.1s ease;
        }

        .primary-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* KPI Row */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .kpi-card {
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .kpi-label {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 700;
          color: #f8fafc;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Smooth Progress Bar */
        .progress-track {
          width: 100%;
          height: 6px;
          background: #1e293b;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 4px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        /* Main 2-Column Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 24px;
          align-items: start;
        }

        .panel-card {
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-meta {
          font-size: 12px;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
        }

        /* 3D Viewport Container */
        .topology-viewport {
          height: 340px;
          background: radial-gradient(circle at center, #0f172a 0%, #090d16 100%);
          position: relative;
        }

        .node-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 4px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .node-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .node-port {
          color: #f8fafc;
          font-weight: 600;
        }

        .node-svc {
          color: #94a3b8;
        }

        .host-label {
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid #475569;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Compact Telemetry Log */
        .log-list {
          padding: 14px 20px;
          background: #0b1120;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .log-row {
          display: flex;
          gap: 10px;
          color: #cbd5e1;
        }

        .log-time { color: #64748b; }
        .log-step { color: #60a5fa; font-weight: 600; min-width: 48px; }

        /* AI Findings Section */
        .card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .summary-banner {
          background: #0b1120;
          border: 1px solid #1e293b;
          border-left: 3px solid #3b82f6;
          border-radius: 8px;
          padding: 14px 16px;
        }

        .summary-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #60a5fa;
          margin-bottom: 6px;
        }

        .summary-text {
          font-size: 13.5px;
          line-height: 1.6;
          color: #e2e8f0;
        }

        .finding-card {
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s ease;
        }

        .finding-card:hover {
          border-color: #334155;
        }

        .finding-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .port-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sev-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .vuln-desc {
          font-size: 13px;
          line-height: 1.55;
          color: #94a3b8;
        }

        .remediation-box {
          background: #111827;
          border: 1px solid #1e293b;
          border-radius: 6px;
          padding: 10px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #38bdf8;
        }

        .remediation-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }
      `}</style>

      {/* TOP BAR */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Shield size={20} />
          </div>
          <div>
            <div className="brand-title">Aegis SecOps</div>
            <div className="brand-subtitle">Autonomous Network Reconnaissance &amp; Local LLM Threat Analysis</div>
          </div>
        </div>

        <form className="search-form" onSubmit={runScan}>
          <div className="input-wrap">
            <Search size={15} color="#64748b" />
            <input
              className="target-input"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="Enter IP or hostname..."
            />
          </div>
          <button type="submit" className="primary-btn" disabled={loading}>
            <Play size={14} />
            {loading ? 'Scanning...' : 'Run Audit'}
          </button>
        </form>
      </header>

      {/* KPI SUMMARY ROW */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Target Host</span>
            <Server size={15} color="#64748b" />
          </div>
          <div className="kpi-value">{report?.target || target}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Exposed Services</span>
            <Activity size={15} color="#64748b" />
          </div>
          <div className="kpi-value">{openPorts.length} Active Ports</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Overall Risk Posture</span>
            <ShieldAlert size={15} color={riskBadge.text} />
          </div>
          <div>
            <span
              className="sev-pill"
              style={{
                background: riskBadge.bg,
                color: riskBadge.text,
                border: `1px solid ${riskBadge.border}`,
                fontSize: '13px'
              }}
            >
              {riskLevel.toUpperCase()} RISK
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>{statusText}</span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#60a5fa' }}>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <main className="content-grid">
        {/* LEFT COLUMN: 3D TOPOLOGY + AUDIT LOGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel-card">
            <div className="card-header">
              <div className="card-title">
                <Cpu size={16} color="#60a5fa" />
                Live Network Topology
              </div>
              <span className="card-meta">Interactive 3D View</span>
            </div>
            <div className="topology-viewport">
              <Canvas camera={{ position: [0, 3.2, 6.2], fov: 42 }}>
                <TopologyScene report={report} target={target} />
              </Canvas>
            </div>
          </div>

          <div className="panel-card">
            <div className="card-header">
              <div className="card-title">
                <Terminal size={16} color="#60a5fa" />
                Execution Telemetry
              </div>
              <span className="card-meta">python-nmap + ollama</span>
            </div>
            <div className="log-list">
              {logs.map((log, index) => (
                <div key={index} className="log-row">
                  <span className="log-time">{log.time}</span>
                  <span className="log-step">[{log.step}]</span>
                  <span>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI SECURITY REPORT */}
        <div className="panel-card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 size={16} color="#10b981" />
              AI Vulnerability Assessment
            </div>
            <span className="card-meta">Model: Local Ollama</span>
          </div>

          <div className="card-body">
            <div className="summary-banner">
              <div className="summary-label">Executive Summary</div>
              <div className="summary-text">{report?.ai_analysis?.summary}</div>
            </div>

            {findings.map((item, idx) => {
              const badge = getBadgeStyle(item.severity)
              return (
                <div key={idx} className="finding-card">
                  <div className="finding-top">
                    <div className="port-title">
                      <AlertTriangle size={15} color={badge.text} />
                      Port {item.port} / {item.service}
                    </div>
                    <span
                      className="sev-pill"
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`
                      }}
                    >
                      {(item.severity || 'Low').toUpperCase()}
                    </span>
                  </div>

                  <div className="vuln-desc">{item.vulnerability}</div>

                  <div className="remediation-box">
                    <div className="remediation-label">Recommended Remediation</div>
                    <code>$ {item.remediation}</code>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}