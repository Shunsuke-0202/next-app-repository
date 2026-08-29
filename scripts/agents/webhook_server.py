from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import os
import requests

app = FastAPI()


class TriggerPayload(BaseModel):
    issue: str | None = None
    title: str | None = None


@app.post("/trigger")
def trigger(payload: TriggerPayload, x_trigger_token: str | None = Header(None)):
    expected = os.environ.get("TRIGGER_TOKEN")
    if expected and x_trigger_token != expected:
        raise HTTPException(status_code=403, detail="invalid trigger token")

    issue_text = payload.issue or payload.title or "# チャット発行の課題\n\n自動生成された課題です。"

    repo_issue_path = os.path.join(os.getcwd(), ".github", "ISSUE.md")
    os.makedirs(os.path.dirname(repo_issue_path), exist_ok=True)
    with open(repo_issue_path, "w") as f:
        f.write(issue_text)

    # Try to dispatch to GitHub if token and repo provided
    gh_token = os.environ.get("GITHUB_TOKEN")
    gh_repo = os.environ.get("GITHUB_REPO")

    if not gh_token or not gh_repo:
        return {
            "status": "ok",
            "note": "Wrote .github/ISSUE.md. Skipped GitHub dispatch because GITHUB_TOKEN or GITHUB_REPO not set.",
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
