from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
import json
from scanner import SecOpsScanner

app = FastAPI(title="SecOps AI Agent Backend")

# Updated CORS block - allows all origins during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Bypasses the localhost vs 127.0.0.1 mismatch
    allow_credentials=True,
    allow_methods=["*"], # Crucial: This explicitly allows the OPTIONS method
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    target: str

SYSTEM_PROMPT = """
You are an expert Autonomous SecOps AI Agent.
Your objective is to analyze raw Nmap scan data provided in JSON format and output a structured security assessment.

RULES:
1. You MUST output ONLY valid JSON.
2. Identify potential vulnerabilities, misconfigurations, or risks based on the exposed ports and service versions.
3. Assign a severity level (Low, Medium, High, Critical).
4. Provide a concise, actionable remediation step for each finding.

OUTPUT FORMAT:
{
  "summary": "A 1-sentence overview of the network's security posture.",
  "risk_level": "Low|Medium|High|Critical",
  "findings": [
    {
      "port": <port_number>,
      "service": "<service_name>",
      "vulnerability": "<description of the risk>",
      "severity": "<Low|Medium|High|Critical>",
      "remediation": "<exact command or configuration change>"
    }
  ]
}
"""

@app.post("/api/scan")
def run_scan(req: ScanRequest):
    # 1. Run the local Nmap scan
    scanner = SecOpsScanner()
    scan_results = scanner.scan_target(req.target)
    
    if scan_results.get("status") != "up":
        return {"error": f"Target {req.target} is down or unreachable.", "raw_scan": scan_results}

    # 2. Feed the raw data to your local AI
    try:
        response = ollama.chat(
            model='qwen2.5:3b',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': json.dumps(scan_results)}
            ],
            format='json' # Forces Ollama to strictly return a JSON object
        )
        
        # 3. Parse the string response into a Python dictionary
        ai_assessment = json.loads(response['message']['content'])
        
        return {
            "target": req.target,
            "scan_data": scan_results,
            "ai_analysis": ai_assessment
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing failed: {str(e)}")
