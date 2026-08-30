from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import os
import re
import requests
from datetime import datetime
from pathlib import Path

app = FastAPI()


class TriggerPayload(BaseModel):
    issue: str | None = None
    title: str | None = None


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9\-\_]+", "-", value.strip())
    normalized = normalized.strip("-")
    return normalized[:40] or "requirement"


def _archive_issue(issue_text: str) -> str:
    root = Path(os.getcwd())
    archive_dir = root / ".github" / "issues"
    archive_dir.mkdir(parents=True, exist_ok=True)

    date_prefix = datetime.utcnow().strftime("%Y%m%d")
    archive_path = archive_dir / f"{date_prefix}_{_slugify(issue_text)}.md"
    counter = 1
    while archive_path.exists():
        archive_path = archive_dir / f"{date_prefix}_{_slugify(issue_text)}_{counter}.md"
        counter += 1

    archive_path.write_text(issue_text, encoding="utf-8")

    latest_issue = root / ".github" / "ISSUE.md"
    latest_issue.parent.mkdir(parents=True, exist_ok=True)
    latest_issue.write_text(issue_text, encoding="utf-8")
    return str(archive_path)


@app.post("/trigger")
def trigger(payload: TriggerPayload, x_trigger_token: str | None = Header(None)):
    expected = os.environ.get("TRIGGER_TOKEN")
    if expected and x_trigger_token != expected:
        raise HTTPException(status_code=403, detail="invalid trigger token")

    issue_text = payload.issue or payload.title or "# チャット発行の課題\n\n自動生成された課題です。"
    archived_path = _archive_issue(issue_text)

    # Try to dispatch to GitHub if token and repo provided
    gh_token = os.environ.get("GITHUB_TOKEN")
    gh_repo = os.environ.get("GITHUB_REPO")

    if not gh_token or not gh_repo:
        return {
            "status": "ok",
            "note": f"Archived issue to {archived_path}. Skipped GitHub dispatch because GITHUB_TOKEN or GITHUB_REPO not set.",
        }

    url = f"https://api.github.com/repos/{gh_repo}/dispatches"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"token {gh_token}",
    }
    body = {"event_type": "run-agents", "client_payload": {"source": "webhook_server"}}

    r = requests.post(url, json=body, headers=headers)
    if r.status_code in (204, 201):
        return {"status": "dispatched"}
    else:
        raise HTTPException(status_code=500, detail={"status_code": r.status_code, "body": r.text})
