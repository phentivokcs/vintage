"""Trade analysis helpers for the paper trading SQLite database."""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

import pandas as pd
import yaml

from sol_mean_reversion_bot.storage.db import BotDatabase

DEFAULT_CONFIG_PATH = Path(__file__).parents[1] / "config.yaml"


def load_config(path: Path) -> dict:
    """Load bot configuration from YAML."""
    with path.open("r", encoding="utf-8") as config_file:
        return yaml.safe_load(config_file)


def analyze(database_path: str) -> dict:
    """Calculate first-pass trade statistics from closed sell trades."""
    BotDatabase(database_path)
    with sqlite3.connect(database_path) as connection:
        trades = pd.read_sql_query("SELECT * FROM trades ORDER BY timestamp", connection)
        equity = pd.read_sql_query("SELECT * FROM equity_history ORDER BY timestamp", connection)

    sells = trades[trades["side"] == "sell"] if not trades.empty else pd.DataFrame()
    gross_profit = sells.loc[sells["realized_pnl"] > 0, "realized_pnl"].sum() if not sells.empty else 0
    gross_loss = abs(sells.loc[sells["realized_pnl"] < 0, "realized_pnl"].sum()) if not sells.empty else 0
    max_drawdown = 0.0
    if not equity.empty:
        running_max = equity["equity"].cummax()
        drawdown = (equity["equity"] - running_max) / running_max
        max_drawdown = float(drawdown.min())

    return {
        "closed_trades": int(len(sells)),
        "winrate": float((sells["realized_pnl"] > 0).mean()) if not sells.empty else 0.0,
        "profit_factor": float(gross_profit / gross_loss) if gross_loss else 0.0,
        "average_profit": float(sells["realized_pnl"].mean()) if not sells.empty else 0.0,
        "max_drawdown": max_drawdown,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyze paper trading results")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG_PATH, help="YAML konfiguráció útvonala")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    config = load_config(args.config)
    stats = analyze(config["storage"]["database_path"])
    for key, value in stats.items():
        print(f"{key}: {value}")
