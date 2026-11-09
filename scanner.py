import nmap
import json
import sys

class SecOpsScanner:
    def __init__(self):
        try:
            self.nm = nmap.PortScanner()
        except nmap.PortScannerError:
            print("Error: Nmap not found. Ensure it is installed on your system.")
            sys.exit(1)
        except Exception as e:
            print(f"Unexpected error initializing Nmap: {e}")
            sys.exit(1)

    def scan_target(self, target_ip, arguments='-sV -T4 -F'):
        """
        -sV: Service version detection
        -T4: Aggressive timing (faster)
        -F: Fast mode (scans top 100 ports)
        """
        print(f"[*] Initiating scan on {target_ip}...", file=sys.stderr)
        
        try:
            self.nm.scan(hosts=target_ip, arguments=arguments)
        except Exception as e:
            return {"target": target_ip, "status": "error", "message": str(e)}

        scan_results = {
            "target": target_ip,
            "status": "down",
            "open_ports": []
        }

        # Check if the target responded
        if target_ip in self.nm.all_hosts():
            host_state = self.nm[target_ip].state()
            scan_results["status"] = host_state

            if host_state == 'up':
                # Iterate through all detected protocols (usually 'tcp' and 'udp')
                for proto in self.nm[target_ip].all_protocols():
                    ports = self.nm[target_ip][proto].keys()
                    for port in sorted(ports):
                        port_info = self.nm[target_ip][proto][port]
                        
                        if port_info['state'] == 'open':
                            scan_results["open_ports"].append({
                                "port": port,
                                "protocol": proto,
                                "service": port_info.get('name', 'unknown'),
                                "product": port_info.get('product', ''),
                                "version": port_info.get('version', ''),
                                "extrainfo": port_info.get('extrainfo', '')
                            })
                            
        return scan_results

if __name__ == "__main__":
    # Testing locally on the loopback interface
    target = "127.0.0.1" 
    
    scanner = SecOpsScanner()
    results = scanner.scan_target(target)
    
    # Output cleanly formatted JSON
    print(json.dumps(results, indent=4))
