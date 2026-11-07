"""Servidor local para probar la clase: python servir.py  (luego abre http://localhost:8000)
Necesario porque main.js lee content.json con fetch (no funciona con doble clic)."""
import http.server, socketserver, webbrowser, os
PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), H) as s:
    print(f'Clase en http://localhost:{PORT}  (Ctrl+C para salir)')
    webbrowser.open(f'http://localhost:{PORT}')
    s.serve_forever()
