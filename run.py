import sys
import os
import socket
import uvicorn

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

def find_available_port(preferred_ports=[8080, 8001, 8000, 8888]):
    for port in preferred_ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('0.0.0.0', port))
                return port
            except OSError:
                continue
    return 8080

if __name__ == "__main__":
    port = 8080
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    else:
        port = find_available_port([8080, 8001, 8888, 8000])

    print("=" * 65)
    print("       ♠ ♥ ♦ ♣  TEXAS HOLD'EM POKER ACADEMY  ♣ ♦ ♥ ♠")
    print(f"  Live Web Application: http://localhost:{port}")
    print(f"  Interactive API Docs: http://localhost:{port}/docs")
    print("=" * 65)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
