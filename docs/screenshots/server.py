"""SPA 服务器 — 所有路径 fallback 到 index.html"""
import http.server
import os

DIST = "/workspace/smile-app/projects/client/dist"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        path = self.path.split("?")[0]
        file_path = os.path.join(DIST, path.lstrip("/"))
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            # SPA fallback: 所有不存在的路径返回 index.html
            self.path = "/index.html"
        return super().do_GET()

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", 8000), SPAHandler)
    print("SPA server on :8000")
    server.serve_forever()
