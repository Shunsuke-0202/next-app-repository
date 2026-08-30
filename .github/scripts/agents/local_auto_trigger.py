#!/usr/bin/env python3
"""Minimal local requirement confirmation and auto-trigger flow.

Usage examples:
  python3 .github/scripts/agents/local_auto_trigger.py --requirement "App Service のヘルスチェックを追加したい"
  python3 .github/scripts/agents/local_auto_trigger.py --requirement-file .github/ISSUE.md
  TRIGGER_TOKEN=secret python3 .github/scripts/agents/local_auto_trigger.py --requirement "..." --webhook-url http://127.0.0.1:8000/trigger
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path


def find_repo_root(start: Path | None = None) -> Path:
    p = (start or Path(__file__)).resolve().parent
    for _ in range(10):
        if (p / '.git').exists() or (p / 'README.md').exists():
            return p
        if p.parent == p:
            break
        p = p.parent
    return Path.cwd()


ROOT = find_repo_root()
AGENT_DIR = ROOT / ".github" / "scripts" / "agents"


def read_requirement(args: argparse.Namespace) -> str:
    if args.requirement:
        return args.requirement.strip()
    if args.requirement_file:
        p = Path(args.requirement_file)
        if not p.exists():
            raise FileNotFoundError(f"requirement file not found: {p}")
        return p.read_text(encoding="utf-8").strip()

    print("要件を入力してください。空行で終了します。")
    lines: list[str] = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if not lines and line.strip() == "":
            continue
        if line.strip() == "" and lines:
            break
        lines.append(line)
    requirement = "\n".join(lines).strip()
    if not requirement:
        raise ValueError("要件が空です。")
    return requirement


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9\-\_]+", "-", value.strip())
    normalized = normalized.strip("-")
    return normalized[:40] or "requirement"


def ensure_issue_file(requirement: str) -> None:
    archive_dir = ROOT / ".github" / "issues"
    archive_dir.mkdir(parents=True, exist_ok=True)

    date_prefix = datetime.utcnow().strftime("%Y%m%d")
    base_name = f"{date_prefix}_{_slugify(requirement)}"
    archive_path = archive_dir / f"{base_name}.md"
    counter = 1
    while archive_path.exists():
        archive_path = archive_dir / f"{base_name}_{counter}.md"
        counter += 1

    archive_path.write_text(requirement, encoding="utf-8")

    latest_issue = ROOT / ".github" / "ISSUE.md"
    latest_issue.parent.mkdir(parents=True, exist_ok=True)
    latest_issue.write_text(requirement, encoding="utf-8")

    print(f"issue archived: {archive_path}")
    print(f"latest issue updated: {latest_issue}")


def send_webhook(requirement: str, webhook_url: str | None, token: str | None) -> bool:
    if not webhook_url:
        return False

    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Trigger-Token"] = token

    payload = {"issue": requirement}
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(webhook_url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            body = response.read().decode("utf-8", errors="replace")
            print(f"webhook accepted: HTTP {response.status}")
            print(body or "empty response")
            return True
    except (urllib.error.URLError, TimeoutError) as exc:
        print(f"webhook unavailable; falling back to local execution. ({exc})")
        return False


def run_agent_pipeline() -> int:
    scripts = [
        AGENT_DIR / "pm_agent.sh",
        AGENT_DIR / "dev_agent.sh",
        AGENT_DIR / "review_agent.sh",
    ]

    env = os.environ.copy()
    env.setdefault("APP_DIR", "app-service")
    env.setdefault("MAX_ATTEMPTS", "3")
    env.setdefault("AUTO_PUSH", "false")

    for script in scripts:
        print(f"\n=== {script.name} を実行 ===")
        result = subprocess.run(["bash", str(script)], cwd=ROOT, env=env)
        if result.returncode != 0:
            print(f"{script.name} failed with exit code {result.returncode}")
            return result.returncode

    print("\nエージェント実行完了")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Confirm a requirement and trigger the local agent flow.")
    parser.add_argument("--requirement", help="要件本文を直接指定")
    parser.add_argument("--requirement-file", help="要件を記載したファイルのパス")
    parser.add_argument("--webhook-url", default=os.environ.get("WEBHOOK_URL", "http://127.0.0.1:8000/trigger"), help="POST 先の webhook URL")
    parser.add_argument("--no-webhook", action="store_true", help="webhook を使わずにローカル実行のみ行う")
    args = parser.parse_args()

    try:
        requirement = read_requirement(args)
    except Exception as exc:
        print(f"要件取得に失敗しました: {exc}", file=sys.stderr)
        return 1

    print("\n=== 確認したい要件 ===")
    print(requirement)
    print("====================")

    answer = input("この要件で確定しますか？ [Y/n]: ").strip().lower()
    if answer not in ("", "y", "yes"):
        print("ユーザーが要件確定をキャンセルしました。処理を中止します。")
        return 0

    ensure_issue_file(requirement)

    webhook_used = False
    if not args.no_webhook:
        token = os.environ.get("TRIGGER_TOKEN")
        webhook_used = send_webhook(requirement, args.webhook_url, token)

    if not webhook_used:
        print("ローカルのエージェント実行を開始します。")
    else:
        print("webhook で受け付けました。ローカルのエージェント実行も続行します。")

    return run_agent_pipeline()


if __name__ == "__main__":
    raise SystemExit(main())
