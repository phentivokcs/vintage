"""Binance OHLCV data access through CCXT."""

from __future__ import annotations

import ccxt
import pandas as pd

OHLCV_COLUMNS = ["timestamp", "open", "high", "low", "close", "volume"]


class BinanceDataClient:
    """Small wrapper around CCXT for loading clean Binance candle data."""

    def __init__(self) -> None:
        self.exchange = ccxt.binance({"enableRateLimit": True})

    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        limit: int = 500,
        since: int | None = None,
    ) -> pd.DataFrame:
        """Fetch candles and return a time-indexed DataFrame."""
        candles = self.exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=since, limit=limit)
        return clean_ohlcv(candles)


def clean_ohlcv(candles: list[list[float]]) -> pd.DataFrame:
    """Convert CCXT candles to a sorted, de-duplicated OHLCV DataFrame."""
    frame = pd.DataFrame(candles, columns=OHLCV_COLUMNS)
    if frame.empty:
        return frame

    frame["timestamp"] = pd.to_datetime(frame["timestamp"], unit="ms", utc=True)
    numeric_columns = ["open", "high", "low", "close", "volume"]
    frame[numeric_columns] = frame[numeric_columns].apply(pd.to_numeric, errors="coerce")
    frame = frame.dropna(subset=numeric_columns)
    frame = frame.drop_duplicates(subset="timestamp").sort_values("timestamp")
    return frame.reset_index(drop=True)
