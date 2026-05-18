"""Long-only SOL mean reversion strategy rules."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import pandas as pd

SignalType = Literal["buy", "sell", "hold"]


@dataclass(frozen=True)
class Signal:
    """Trading signal emitted by the mean reversion strategy."""

    action: SignalType
    reason: str
    stop_price: float | None = None


class MeanReversionStrategy:
    """Evaluate entry and exit rules for a long-only mean reversion setup."""

    def __init__(self, config: dict) -> None:
        self.config = config
        self.atr_stop_multiplier = config["strategy"]["atr_stop_multiplier"]
        self.rsi_entry = config["strategy"]["rsi_entry"]

    def evaluate_entry(self, row: pd.Series) -> Signal:
        """Return a buy signal when all entry conditions are true."""
        if self._has_missing_values(row):
            return Signal("hold", "indikátor bemelegítés")

        trend_filter = row["close"] > row["ema200"]
        band_reversion = row["close"] < row["bb_lower"]
        oversold = row["rsi"] < self.rsi_entry

        if trend_filter and band_reversion and oversold:
            stop_price = row["close"] - (row["atr"] * self.atr_stop_multiplier)
            return Signal("buy", "EMA trend + Bollinger alsó szalag + RSI túladott", float(stop_price))

        return Signal("hold", "nincs belépési jel")

    def evaluate_exit(self, row: pd.Series, position: dict) -> Signal:
        """Return a sell signal when the take-profit or ATR stop is reached."""
        if self._has_missing_values(row):
            return Signal("hold", "indikátor bemelegítés")

        stop_price = position.get("stop_price")
        if stop_price is not None and row["low"] <= stop_price:
            return Signal("sell", "ATR stop sérült")

        if row["close"] >= row["bb_middle"]:
            return Signal("sell", "Bollinger középső szalag elérve")

        return Signal("hold", "pozíció tartása")

    @staticmethod
    def _has_missing_values(row: pd.Series) -> bool:
        required_columns = ["ema200", "rsi", "bb_lower", "bb_middle", "atr"]
        return row[required_columns].isna().any()
