import sys
from pathlib import Path

root_path = Path(__file__).resolve().parent.parent
sys.path.append(str(root_path))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents.engine import (
    run_triage,
    generate_mitigation_script,
    execute_in_sandbox,
    commit_incident_audit
)

app = FastAPI(title="Multi-Agent Security Workflow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/run-workflow")
async def run_workflow(payload: dict):
    try:
        # 1. Triage Agent
        triage_result = run_triage(payload)
        
        # 2. Coder Agent
        mitigation_code = generate_mitigation_script(triage_result)
        
        # 3. Sandbox Executor
        run_output = execute_in_sandbox(mitigation_code)
        
        # 4. VCS Audit
        vcs_log = commit_incident_audit(triage_result, mitigation_code)
        
        return {
            "status": "success",
            "triage": triage_result,
            "code": mitigation_code,
            "execution_output": run_output,
            "vcs_log": vcs_log
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))