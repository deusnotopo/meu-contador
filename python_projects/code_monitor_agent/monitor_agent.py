"""
╔══════════════════════════════════════════════════════════════╗
║  Code Monitor Agent — Real-time Error & Quality Reporter    ║
║  Uses watchdog + ruff + custom rules for instant feedback   ║
╚══════════════════════════════════════════════════════════════╝
"""
import os
import sys
import time
import subprocess
from concurrent.futures import ThreadPoolExecutor
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from custom_rules import CustomRules

console = Console()

# ── Configuration ───────────────────────────────────────────
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IGNORED_DIRS = {
    ".git", "node_modules", "dist", "build", ".venv",
    "__pycache__", ".next", ".mypy_cache", ".pytest_cache",
    ".auxly", ".antigravity", ".kilo", ".qodo", ".vercel",
    "coverage", ".agent", ".github", ".husky",
}
IGNORED_EXTENSIONS = {".map", ".lock", ".log", ".json", ".md", ".yml", ".yaml", ".env", ".css", ".html", ".svg", ".png", ".jpg", ".ico"}
VALID_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx"}
DEBOUNCE_SECONDS = 1.0  # Increased to reduce noise
STARTUP_GRACE_PERIOD = 3  # Seconds to ignore events after start (avoids initial flood)


class AnalysisEngine:
    """Dispatches analysis tasks to the correct handler based on file extension."""

    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.last_results = {}
        self.stats = {"total_scans": 0, "errors_found": 0, "clean_files": 0}

    def analyze(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in VALID_EXTENSIONS:
            return  # Skip non-code files silently
        if ext == ".py":
            self.executor.submit(self._safe_run, self.run_python_checks, file_path)
        elif ext in {".ts", ".tsx", ".js", ".jsx"}:
            self.executor.submit(self._safe_run, self.run_ts_checks, file_path)

    def _safe_run(self, func, file_path):
        """Wrapper to catch any unhandled exceptions in thread."""
        try:
            func(file_path)
        except Exception as e:
            self.report(file_path, "⚠️ Error", f"Internal: {e}")

    # ── Python Analysis ─────────────────────────────────────
    def run_python_checks(self, file_path):
        reports = []
        # 1. Ruff (ultra-fast Rust linter)
        result = subprocess.run(
            ["ruff", "check", "--output-format", "concise", file_path],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0 and result.stdout.strip():
            # Extract just the relevant lines
            for line in result.stdout.strip().splitlines():
                if file_path.replace("\\", "/") in line.replace("\\", "/") or line.strip().startswith("Found"):
                    reports.append(line.strip())

        # 2. Custom Rules
        custom_issues = CustomRules.check_file(file_path)
        reports.extend(custom_issues)

        if reports:
            self.report(file_path, "[Error]", " | ".join(reports[:3]))
        else:
            self.report(file_path, "[Clean]", "OK")

    # ── TypeScript/JavaScript Analysis ──────────────────────
    def run_ts_checks(self, file_path):
        reports = []

        # 1. Custom Rules (fast, always runs)
        custom_issues = CustomRules.check_file(file_path)
        reports.extend(custom_issues)

        # 2. Try npx eslint directly on the file (more reliable than npm run lint)
        try:
            rel_path = os.path.relpath(file_path, PROJECT_ROOT)
            workspace = rel_path.split(os.sep)[0] if os.sep in rel_path else None

            if workspace in ["frontend", "backend"]:
                workspace_dir = os.path.join(PROJECT_ROOT, workspace)
                result = subprocess.run(
                    ["npx", "eslint", "--no-error-on-unmatched-pattern", "--format", "compact", file_path],
                    capture_output=True, text=True, shell=True,
                    cwd=workspace_dir, timeout=30
                )
                output = (result.stdout + result.stderr).strip()
                if result.returncode != 0 and output:
                    # Extract error/warning lines
                    for line in output.splitlines():
                        low = line.lower()
                        if "error" in low or "warning" in low:
                            # Shorten path for readability
                            short = line.replace(file_path, os.path.basename(file_path))
                            reports.append(short.strip()[:120])
                            break  # Just the first error for brevity
        except subprocess.TimeoutExpired:
            reports.append("ESLint timed out")
        except Exception:
            pass  # ESLint not available, rely on custom rules only

        if reports:
            self.report(file_path, "[Error]", " | ".join(reports[:3]))
        else:
            self.report(file_path, "[Clean]", "OK")

    # ── Reporting ───────────────────────────────────────────
    def report(self, file_path, status, details):
        self.stats["total_scans"] += 1
        if "Error" in status:
            self.stats["errors_found"] += 1
        else:
            self.stats["clean_files"] += 1

        self.last_results[file_path] = {
            "time": time.strftime("%H:%M:%S"),
            "status": status,
            "details": details.strip() if details.strip() else "(no details)"
        }
        self.render_ui()

    def render_ui(self):
        # Header stats
        stats_text = (
            f"[bold cyan]Scans:[/] {self.stats['total_scans']}  "
            f"[bold red]Errors:[/] {self.stats['errors_found']}  "
            f"[bold green]Clean:[/] {self.stats['clean_files']}  "
            f"[dim]Root: {PROJECT_ROOT}[/]"
        )

        table = Table(
            title="LIVE CODE MONITOR",
            caption=stats_text,
            expand=True,
            border_style="bright_blue",
            title_style="bold bright_white",
        )
        table.add_column("Time", width=10, style="dim")
        table.add_column("File", style="cyan", max_width=50)
        table.add_column("Status", width=12, justify="center")
        table.add_column("Details", overflow="fold")

        # Show last 15 results
        sorted_results = sorted(
            self.last_results.items(),
            key=lambda x: x[1]["time"],
            reverse=True,
        )[:15]

        for path, data in sorted_results:
            rel_path = os.path.relpath(path, PROJECT_ROOT)
            status_style = "green" if "Clean" in data["status"] else "red"
            detail_text = data["details"][:150]
            table.add_row(
                data["time"],
                rel_path,
                f"[{status_style}]{data['status']}[/{status_style}]",
                detail_text,
            )

        os.system("cls" if os.name == "nt" else "clear")
        console.print(table)


class MonitorHandler(FileSystemEventHandler):
    """Watches for file changes and dispatches analysis."""

    def __init__(self, engine, start_time):
        self.engine = engine
        self.debounce = {}
        self.start_time = start_time

    def _should_ignore(self, file_path):
        """Check if this event should be ignored."""
        # Grace period after startup
        if time.time() - self.start_time < STARTUP_GRACE_PERIOD:
            return True
        # Ignored directories
        parts = file_path.replace("\\", "/").split("/")
        for part in parts:
            if part in IGNORED_DIRS:
                return True
        # Ignored extensions
        ext = os.path.splitext(file_path)[1].lower()
        if ext in IGNORED_EXTENSIONS or ext not in VALID_EXTENSIONS:
            return True
        return False

    def on_modified(self, event):
        if event.is_directory:
            return
        file_path = event.src_path
        if self._should_ignore(file_path):
            return

        now = time.time()
        if file_path in self.debounce and now - self.debounce[file_path] < DEBOUNCE_SECONDS:
            return

        self.debounce[file_path] = now
        self.engine.analyze(file_path)

    def on_created(self, event):
        """Also catch newly created files."""
        if event.is_directory:
            return
        file_path = event.src_path
        if self._should_ignore(file_path):
            return
        self.engine.analyze(file_path)


def main():
    engine = AnalysisEngine()
    start_time = time.time()
    event_handler = MonitorHandler(engine, start_time)
    observer = Observer()
    observer.schedule(event_handler, PROJECT_ROOT, recursive=True)

    console.print(
        Panel(
            f"[bold green]Code Monitor Agent Started[/bold green]\n"
            f"[dim]Monitoring:[/] {PROJECT_ROOT}\n"
            f"[dim]Watching:[/] .py .ts .tsx .js .jsx\n"
            f"[dim]Linters:[/] ruff (Python) + eslint (TS/JS) + custom rules\n"
            f"[dim]Press Ctrl+C to stop[/]",
            title="[bold bright_white]Init[/]",
            border_style="bright_green",
        )
    )

    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        console.print("\n[bold yellow]Stopping monitor...[/]")
        observer.stop()
    observer.join()
    console.print("[bold green]Monitor stopped cleanly.[/]")



if __name__ == "__main__":
    main()
