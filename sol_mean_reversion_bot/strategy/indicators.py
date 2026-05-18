"""Technical indicator calculations for the SOL mean reversion bot."""

from __future__ import annotations

import pandas as pd


def ema(series: pd.Series, period: int) -> pd.Series:
    """Return an exponential moving average."""
    return series.ewm(span=period, adjust=False).mean()


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Return the relative strength index."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    relative_strength = avg_gain / avg_loss.where(avg_loss != 0)
    return 100 - (100 / (1 + relative_strength))


def bollinger_bands(
    series: pd.Series,
    period: int = 20,
    stddev: float = 2.0,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Return lower, middle, and upper Bollinger Bands."""
    middle = series.rolling(window=period, min_periods=period).mean()
    deviation = series.rolling(window=period, min_periods=period).std(ddof=0)
    upper = middle + (deviation * stddev)
    lower = middle - (deviation * stddev)
    return lower, middle, upper


def atr(frame: pd.DataFrame, period: int = 14) -> pd.Series:
    """Return the average true range."""
    high_low = frame["high"] - frame["low"]
    high_close = (frame["high"] - frame["close"].shift()).abs()
    low_close = (frame["low"] - frame["close"].shift()).abs()
    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return true_range.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()


def add_indicators(frame: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Return a copy of the OHLCV frame with strategy indicators attached."""
    result = frame.copy()
    strategy_config = config["strategy"]
    result["ema200"] = ema(result["close"], strategy_config["ema_period"])
    result["rsi"] = rsi(result["close"], strategy_config["rsi_period"])
    lower, middle, upper = bollinger_bands(
        result["close"],
        strategy_config["bollinger_period"],
        strategy_config["bollinger_stddev"],
    )
    result["bb_lower"] = lower
    result["bb_middle"] = middle
    result["bb_upper"] = upper
    result["atr"] = atr(result, strategy_config["atr_period"])
    return result
