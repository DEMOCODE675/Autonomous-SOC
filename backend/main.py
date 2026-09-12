import sys
from pathlib import Path
from pydantic import BaseModel

root_path = Path(__file__).resolve().parent.parent
sys.path.append(str(root_path))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents.engine import (
    run_triage,
    generate_mitigation_script,
    execute_in_sandbox,
    commit_incident_audit,
    create_remote_github_pr,
    log_eval_record,    
)

app = FastAPI(title="Multi-Agent Security Workflow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExecutionRequest(BaseModel):
    triage: dict
    code: str

# 1. Backward-compatible endpoint (fixes the 404 error)
@app.post("/api/run-workflow")
async def run_workflow(payload: dict):
    try:
        triage_result = run_triage(payload)
        mitigation_code = generate_mitigation_script(triage_result)
        execution_output = execute_in_sandbox(mitigation_code)
        vcs_log = create_remote_github_pr(triage_result, mitigation_code)
        
        # Record run in dataset
        log_eval_record(triage_result, mitigation_code, execution_output, vcs_log, mode="autonomous")

        return {
            "status": "success",
            "triage": triage_result,
            "code": mitigation_code,
            "execution_output": execution_output,
            "vcs_log": vcs_log,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. Phase 1: Planning / Triage (for HITL & Auto toggle)
@app.post("/api/plan-mitigation")
async def plan_mitigation(payload: dict):
    try:
        triage_result = run_triage(payload)
        mitigation_code = generate_mitigation_script(triage_result)
        return {
            "status": "pending_approval",
            "triage": triage_result,
            "code": mitigation_code,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Phase 2: Operator Approval Execution
@app.post("/api/approve-and-execute")
async def approve_and_execute(req: ExecutionRequest):
    try:
        execution_output = execute_in_sandbox(req.code)
        vcs_log = create_remote_github_pr(req.triage, req.code)
        
        # Record run in dataset
        log_eval_record(req.triage, req.code, execution_output, vcs_log, mode="hitl")

        return {
            "status": "executed",
            "execution_output": execution_output,
            "vcs_log": vcs_log,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))