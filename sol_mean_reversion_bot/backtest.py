"""Historical backtest runner for the SOL mean reversion strategy."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from sol_mean_reversion_bot.broker.paper_broker import PaperBroker
from sol_mean_reversion_bot.data.binance_data import BinanceDataClient
from sol_mean_reversion_bot.strategy.indicators import add_indicators
from sol_mean_reversion_bot.strategy.mean_reversion import MeanReversionStrategy

DEFAULT_CONFIG_PATH = Path(__file__).with_name("config.yaml")


def load_config(path: Path) -> dict:
    """Load bot configuration from YAML."""
    with path.open("r", encoding="utf-8") as config_file:
        return yaml.safe_load(config_file)


def run_backtest(config: dict, limit: int) -> dict:
    """Fetch historical candles and simulate the strategy."""
    candles = BinanceDataClient().fetch_ohlcv(config["symbol"], config["timeframe"], limit=limit)
    enriched = add_indicators(candles, config)
    strategy = MeanReversionStrategy(config)
    broker = PaperBroker(config)
    closed_trades = []

    for _, row in enriched.iterrows():
        timestamp = row["timestamp"].isoformat()
        close = float(row["close"])

        if broker.open_position is None:
            signal = strategy.evaluate_entry(row)
            if signal.action == "buy":
                broker.buy(close, timestamp, signal.reason, signal.stop_price)
        else:
            signal = strategy.evaluate_exit(row, broker.open_position)
            if signal.action == "sell":
                exit_price = (
                    float(broker.open_position.get("stop_price") or close)
                    if "stop" in signal.reason.lower()
                    else close
                )
                closed_trades.append(broker.sell(exit_price, timestamp, signal.reason))

    final_price = float(enriched.iloc[-1]["close"])
    wins = [trade for trade in closed_trades if trade["realized_pnl"] > 0]
    return {
        "symbol": config["symbol"],
        "timeframe": config["timeframe"],
        "trades": len(closed_trades),
        "winrate": (len(wins) / len(closed_trades)) if closed_trades else 0,
        "final_equity": broker.equity(final_price),
        "cash": broker.cash,
        "open_position": broker.open_position is not None,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SOL mean reversion backtest")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG_PATH, help="YAML konfiguráció útvonala")
    parser.add_argument("--limit", type=int, default=1000, help="Letöltendő gyertyák száma")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    result = run_backtest(load_config(args.config), args.limit)
    for key, value in result.items():
        print(f"{key}: {value}")
