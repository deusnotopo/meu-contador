import http.server
import socketserver
import json
import os
from pathlib import Path

PORT = 8000
CRM_FILE = Path("crm_state.json")

# Guarantee file exists
if not CRM_FILE.exists():
    with open(CRM_FILE, "w", encoding="utf-8") as f:
        json.dump({}, f)

class LeadEngineHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/crm':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Load new state update
                payload = json.loads(post_data.decode('utf-8'))
                lead_id = payload.get('id')
                new_status = payload.get('status')
                
                # Update persistent file
                with open(CRM_FILE, "r", encoding="utf-8") as f:
                    crm_state = json.load(f)
                
                crm_state[lead_id] = new_status
                
                with open(CRM_FILE, "w", encoding="utf-8") as f:
                    json.dump(crm_state, f, ensure_ascii=False, indent=2)

                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), LeadEngineHandler) as httpd:
        print(f"[*] Lead Engine Server v5.0 running on port {PORT}")
        print(f"[*] Local CRM state saving enabled (crm_state.json)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
