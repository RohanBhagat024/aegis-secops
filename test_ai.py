import ollama
import json

# The system prompt we just designed
SYSTEM_PROMPT = """
You are an expert Autonomous SecOps AI Agent.
Your objective is to analyze raw Nmap scan data provided in JSON format and output a structured security assessment.

RULES:
1. You MUST output ONLY valid JSON.
2. Do not include markdown blocks (```json) or conversational text.
3. Identify potential vulnerabilities, misconfigurations, or risks based on the exposed ports and service versions.
4. Assign a severity level (Low, Medium, High, Critical).
5. Provide a concise, actionable remediation step for each finding.

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

# Hardcoded test data (similar to what your scanner.py outputs)
nmap_data = {
    "target": "127.0.0.1",
    "open_ports": [
        {"port": 21, "protocol": "tcp", "service": "ftp", "product": "vsftpd", "version": "2.3.4"},
        {"port": 22, "protocol": "tcp", "service": "ssh", "product": "OpenSSH", "version": "9.2p1"}
    ]
}

print("[*] Analyzing scan data with local AI...")

response = ollama.chat(model='qwen2.5:3b', messages=[
    {
        'role': 'system',
        'content': SYSTEM_PROMPT
    },
    {
        'role': 'user',
        'content': json.dumps(nmap_data)
    }
])

# Print the AI's assessment
print(response['message']['content'])
