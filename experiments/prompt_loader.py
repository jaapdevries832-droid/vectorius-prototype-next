# experiments/prompt_loader.py
from pathlib import Path

def repo_root() -> Path:
    here = Path(__file__).resolve()
    for p in [here] + list(here.parents):
        if (p / "prompts").exists():
            return p
    return here.parent.parent

def read_prompt(name: str) -> str:
    """
    name: e.g. 'grade8_system.md' or 'tutor_mode.md'
    """
    root = repo_root()
    target = root / "prompts" / name
    if target.exists():
        return target.read_text(encoding="utf-8")
    raise FileNotFoundError(f"Prompt not found: {target}")
