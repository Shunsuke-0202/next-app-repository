#!/usr/bin/env python3
import http.server
import socketserver
import os
import re
import json
from datetime import datetime
from pathlib import Path
from urllib import request, error

PORT = int(os.environ.get("PORT", "8000"))
TRIGGER_HEADER = "X-Trigger-Token"


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9\-\_]+", "-", value.strip())
    normalized = normalized.strip("-")
    return normalized[:40] or "requirement"


def _archive_issue(issue_text: str) -> str:
    root = Path(os.getcwd())
    archive_dir = root / '.github' / 'issues'
    archive_dir.mkdir(parents=True, exist_ok=True)

    date_prefix = datetime.utcnow().strftime('%Y%m%d')
    archive_path = archive_dir / f'{date_prefix}_{_slugify(issue_text)}.md'
    counter = 1
    while archive_path.exists():
        archive_path = archive_dir / f'{date_prefix}_{_slugify(issue_text)}_{counter}.md'
        counter += 1

    archive_path.write_text(issue_text, encoding='utf-8')
    latest_issue = root / '.github' / 'ISSUE.md'
    latest_issue.parent.mkdir(parents=True, exist_ok=True)
    latest_issue.write_text(issue_text, encoding='utf-8')
    return str(archive_path)


class Handler(http.server.BaseHTTPRequestHandler):
    def _set_response(self, code=200, content_type="application/json"):
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.end_headers()

    def do_POST(self):
        if self.path != "/trigger":
            self._set_response(404)
            self.wfile.write(json.dumps({"error": "not found"}).encode())
            return

        expected = os.environ.get("TRIGGER_TOKEN")
        recv_token = self.headers.get(TRIGGER_HEADER)
        if expected and recv_token != expected:
            self._set_response(403)
            self.wfile.write(json.dumps({"error": "invalid token"}).encode())
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(body.decode() or '{}')
        except Exception:
            payload = {}

        issue_text = payload.get('issue') or payload.get('title') or '# 自動生成の課題\n\n詳しい内容を記載してください。'
        archived_path = _archive_issue(issue_text)

        gh_token = os.environ.get('GITHUB_TOKEN')
        gh_repo = os.environ.get('GITHUB_REPO')

        if gh_token and gh_repo:
            url = f'https://api.github.com/repos/{gh_repo}/dispatches'
            headers = {
                'Accept': 'application/vnd.github+json',
                'Authorization': f'token {gh_token}',
                'Content-Type': 'application/json',
            }
            body = json.dumps({"event_type": "run-agents", "client_payload": {"source": "webhook_simple"}}).encode()
            req = request.Request(url, data=body, headers=headers, method='POST')
            try:
                with request.urlopen(req) as resp:
                    if resp.status in (200, 201, 204):
                        self._set_response(200)
                        self.wfile.write(json.dumps({"status": "dispatched", "issue_path": archived_path}).encode())
                        return
            except error.HTTPError as e:
                self._set_response(500)
                self.wfile.write(json.dumps({"error": e.reason, "code": e.code, "issue_path": archived_path}).encode())
                return

        self._set_response(200)
        self.wfile.write(json.dumps({"status": "ok", "note": f"Archived issue to {archived_path}", "issue_path": archived_path}).encode())


def run():
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Serving on 127.0.0.1:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('Shutting down')
            httpd.server_close()


if __name__ == '__main__':
    run()
