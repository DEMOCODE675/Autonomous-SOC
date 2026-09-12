# 🛡️ Agentic SOAR: Autonomous Security Orchestration Pipeline

A production-grade, AI-driven Security Operations (SecOps) platform that autonomously detects, triages, and mitigates network threats. By leveraging multi-agent LLM orchestration and GitOps infrastructure-as-code, this system transforms raw network telemetry into verified, sandboxed, and auditable security patches in seconds.

## 🚀 Live Environments

* **Web Command Center (Vercel):** `[https://autonomoussoc.vercel.app/]`
* **Automated GitOps Target Repo:** [DEMOCODE675/security-target-system](https://github.com/DEMOCODE675/security-target-system)

---

## 🧠 Core System Capabilities

This architecture bridges advanced natural language synthesis with rigorous system administration and network packet analysis to ensure zero-trust execution.

* **Real-Time Threat Triage:** Ingests standard system logs (e.g., SSH brute-force, SYN floods, Nmap packet reconnaissance) and mathematically scores threat severity.
* **Autonomous Code Synthesis:** Generates targeted defensive Python scripts (e.g., dynamic `iptables` updates) via Google Gemini 3.6 Flash without blocking delays.
* **Zero-Trust Execution:** Runs synthesized mitigations inside ephemeral Python `subprocess` sandboxes with strictly isolated resource allocation to prevent Remote Code Execution (RCE).
* **Human-in-the-Loop (HITL) Gate:** Enforces security governance by halting execution for manual operator authorization before deployment.
* **GitOps Compliance:** Automatically stages successful mitigations to an external VCS repository, leaving a complete, auditable paper trail.
* **Evaluation Pipeline:** Generates automated `.jsonl` system logs for continuous model benchmarking and future Direct Preference Optimization (DPO).

---

## 🛠️ Local Development Setup

**1. Clone & Configure**
```bash
git clone https://github.com/DEMOCODE675/Autonomous-SOC.git
cd git_wokflow

**2. Create a .env file in the root directory**
```bash
GEMINI_API_KEY=your_google_ai_key
GITHUB_TOKEN=your_personal_access_token
GITHUB_REPO=DEMOCODE675/security-target-system # or #( you can add your own target repo )

**3. Launch the Intelligence Engine (Backend)**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

**4. Launch the Command Center (Frontend)**
```bash
cd frontend
npm install
npm run dev