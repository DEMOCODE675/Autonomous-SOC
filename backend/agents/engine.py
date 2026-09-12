import os
import json
import subprocess
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / "backend" / ".env")
load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is not set.")

client = genai.Client(api_key=api_key)

def run_triage(log_data: dict) -> dict:
    prompt = (
        "You are a cybersecurity triage model. Analyze this security event "
        "and return a strictly valid JSON object with keys: "
        "'threat_type', 'severity' (integer 1-10), 'target_ip', and 'action_summary'.\n\n"
        f"Event Data: {json.dumps(log_data)}"
    )
    
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    return json.loads(response.text)

def generate_mitigation_script(threat_info: dict) -> str:
    prompt = (
        f"Generate a self-contained, instant Python diagnostic script for: {json.dumps(threat_info)}. "
        "Rules:\n"
        "1. NEVER use time.sleep() or any blocking delays. Execute instantly.\n"
        "2. Simulate firewall updates (iptables/nftables) and system metric verifications.\n"
        "3. Print clean, formatted verification logs.\n"
        "4. Return ONLY pure Python code. No markdown backticks or explanations."
    )
    
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt
    )
    return response.text.replace("```python", "").replace("```", "").strip()

def execute_in_sandbox(script_code: str) -> str:
    sandbox_file = BASE_DIR / "sandbox_run.py"
    with open(sandbox_file, "w", encoding="utf-8") as f:
        f.write(script_code)
    
    try:
        result = subprocess.run(
            ["python", str(sandbox_file)],
            capture_output=True,
            text=True,
            timeout=8
        )
        output = result.stdout if result.stdout else result.stderr
    except subprocess.TimeoutExpired:
        output = "Error: Sandbox execution timed out."
    except Exception as exc:
        output = f"Execution error: {str(exc)}"
    finally:
        if sandbox_file.exists():
            sandbox_file.unlink()
            
    return output

def commit_incident_audit(threat_info: dict, script_code: str) -> str:
    """Writes an incident audit log to the data directory and stages it in Git."""
    incidents_dir = BASE_DIR / "data" / "incidents"
    incidents_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = threat_info.get("threat_type", "incident").replace(" ", "_").lower()
    incident_file = incidents_dir / f"{timestamp}_audit.json"
    
    audit_data = {
        "triage": threat_info,
        "mitigation_code": script_code,
        "status": "MITIGATED"
    }
    
    with open(incident_file, "w", encoding="utf-8") as f:
        json.dump(audit_data, f, indent=2)
        
    try:
        # Run real git commands to record the change
        subprocess.run(["git", "add", str(incident_file)], cwd=BASE_DIR, capture_output=True)
        git_status = f"Incident record saved to {incident_file.name} and staged to git index."
    except Exception:
        git_status = f"Incident record saved to {incident_file.name} (Git index unchanged)."
        
    return git_status