"""SQLite persistence for trades, positions, equity, errors, and logs."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any


class BotDatabase:
    """Thin SQLite helper used by the paper broker and runners."""

    def __init__(self, database_path: str) -> None:
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    def connect(self) -> sqlite3.Connection:
        """Open a SQLite connection with dict-like rows."""
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def initialize(self) -> None:
        """Create database tables if they do not exist."""
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    price REAL NOT NULL,
                    quantity REAL NOT NULL,
                    fee REAL NOT NULL,
                    realized_pnl REAL DEFAULT 0,
                    reason TEXT
                );

                CREATE TABLE IF NOT EXISTS positions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    opened_at TEXT NOT NULL,
                    closed_at TEXT,
                    symbol TEXT NOT NULL,
                    entry_price REAL NOT NULL,
                    exit_price REAL,
                    quantity REAL NOT NULL,
                    stop_price REAL,
                    status TEXT NOT NULL,
                    realized_pnl REAL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS equity_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    equity REAL NOT NULL,
                    cash REAL NOT NULL,
                    position_value REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS errors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    message TEXT NOT NULL,
                    context TEXT
                );

                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL
                );
                """
            )

    def insert(self, table: str, values: dict[str, Any]) -> int:
        """Insert a row into a whitelisted table and return its id."""
        allowed_tables = {"trades", "positions", "equity_history", "errors", "logs"}
        if table not in allowed_tables:
            raise ValueError(f"Unsupported table: {table}")

        columns = ", ".join(values.keys())
        placeholders = ", ".join(["?"] * len(values))
        with self.connect() as connection:
            cursor = connection.execute(
                f"INSERT INTO {table} ({columns}) VALUES ({placeholders})",
                list(values.values()),
            )
            return int(cursor.lastrowid)

    def update_position_close(
        self,
        position_id: int,
        closed_at: str,
        exit_price: float,
        realized_pnl: float,
    ) -> None:
        """Mark a stored position as closed."""
        with self.connect() as connection:
            connection.execute(
                """
                UPDATE positions
                SET closed_at = ?, exit_price = ?, status = 'closed', realized_pnl = ?
                WHERE id = ?
                """,
                (closed_at, exit_price, realized_pnl, position_id),
            )
