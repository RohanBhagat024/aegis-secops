# Aegis SecOps: Autonomous Neural Reconnaissance

An autonomous, fully offline security orchestration agent. Aegis SecOps bridges raw infrastructure telemetry (Nmap) with local Large Language Models (Ollama) to perform automated network reconnaissance, identify CVEs, and generate actionable remediation protocols—without exposing sensitive network data to cloud APIs.

## 🚀 Features
* **Automated Reconnaissance:** Asynchronous stealth SYN scans and service version fingerprinting via `python-nmap`.
* **Local AI Inference:** Zero-telemetry vulnerability assessment using local LLMs (Llama 3.2 / Qwen 2.5) via Ollama.
* **Enterprise 3D HUD:** Interactive WebGL network topology visualization built with React Three Fiber.
* **Real-time Pipeline Streaming:** Live execution logs mapping the scan-to-inference pipeline.

## 🏗️ System Architecture
1. **Recon Engine (Python):** Executes aggressive Nmap scans and flattens nested network graphs into strictly formatted JSON payloads.
2. **AI Core (Ollama/FastAPI):** Ingests JSON payloads into a local LLM constrained by strict system prompts to output severity-graded threat matrices.
3. **Command Center (React/Vite):** A high-performance dashboard that parses the AI threat model and renders orbiting nodes in a 3D canvas based on active ports.

---

## 🛠️ Installation & Setup

### Prerequisites
* **Python 3.10+**
* **Node.js 18+**
* **Nmap:** Must be installed and accessible in your system path (`sudo apt install nmap`).
* **Ollama:** Download and install from [ollama.com](https://ollama.com).

### 1. Initialize the Local AI Core
Pull the Llama 3.2 model (or your preferred lightweight model) into your local Ollama instance:
```bash
ollama run llama3.2
```
*Note: The model runs locally. Ensure you have sufficient RAM (8GB+ recommended) available for the LLM.*

### 2. Start the Backend API (FastAPI)
Clone the repository and set up the Python environment:
```bash
git clone [https://github.com/YOUR_USERNAME/aegis-secops.git](https://github.com/YOUR_USERNAME/aegis-secops.git)
cd aegis-secops

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Launch the orchestrator
uvicorn main:app --reload
```
*The backend will boot on `http://127.0.0.1:8000`.*

### 3. Boot the Cybernetic HUD (React)
Open a new terminal tab and start the Vite development server:
```bash
cd aegis-secops/secops-hud
npm install
npm run dev
```
*The HUD will boot on `http://localhost:5173`.*

---

## 💻 Usage
1. Open the HUD in your browser at `http://localhost:5173`.
2. Enter a target IP or hostname (e.g., `127.0.0.1` or `scanme.nmap.org`).
3. Click **Run Audit**.
4. Watch the raw telemetry stream as the Nmap scan executes, followed by the local LLM synthesizing the threat report and spawning the 3D topology map.

## 🔒 Disclaimer
This tool is designed for educational purposes and authorized penetration testing only. Do not scan networks or hosts without explicit permission.
