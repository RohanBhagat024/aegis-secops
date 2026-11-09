# Aegis SecOps: Autonomous Neural Reconnaissance

An autonomous, fully offline security orchestration agent. Aegis SecOps bridges raw infrastructure telemetry (Nmap) with local Large Language Models (Ollama) to perform automated network reconnaissance, identify CVEs, and generate actionable remediation protocols—without exposing sensitive network data to cloud APIs.

## 🚀 Features
* **Automated Reconnaissance:** Asynchronous stealth SYN scans and service version fingerprinting via `python-nmap`.
* **Local AI Inference:** Zero-telemetry vulnerability assessment using local LLMs (Llama 3.2 / Qwen 2.5) via Ollama.
* **Cybernetic 3D HUD:** Interactive WebGL network topology visualization built with React Three Fiber.
* **Real-time Pipeline Streaming:** Live execution logs mapping the scan-to-inference pipeline.

## 🏗️ System Architecture
1. **Recon Engine (Python):** Executes aggressive Nmap scans and flattens nested network graphs into strictly formatted JSON.
2. **AI Core (Ollama/FastAPI):** Ingests JSON payloads into a local LLM constrained by strict system prompts to output severity-graded threat matrices.
3. **Command Center (React/Vite):** A high-performance dashboard that parses the AI threat model and renders orbiting nodes in a 3D canvas based on active ports.

---

## 🛠️ Installation & Setup

### Prerequisites
* **Python 3.10+**
* **Node.js 18+**
* **Nmap:** Must be installed and accessible in your system path (`sudo apt install nmap`).
* **Ollama:** Download and install from [ollama.ai](https://ollama.ai).

### 1. Initialize the Local AI Core
Pull the Llama 3.2 model (or your preferred lightweight model) into your local Ollama instance:
```bash
ollama run llama3.2
