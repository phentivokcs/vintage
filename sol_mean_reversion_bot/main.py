"""Live paper-trading runner for the SOL mean reversion bot."""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import yaml

from sol_mean_reversion_bot.broker.paper_broker import PaperBroker
from sol_mean_reversion_bot.data.binance_data import BinanceDataClient
from sol_mean_reversion_bot.storage.db import BotDatabase
from sol_mean_reversion_bot.strategy.indicators import add_indicators
from sol_mean_reversion_bot.strategy.mean_reversion import MeanReversionStrategy
from sol_mean_reversion_bot.utils.logger import setup_logger

DEFAULT_CONFIG_PATH = Path(__file__).with_name("config.yaml")


def load_config(path: Path) -> dict:
    """Load bot configuration from YAML."""
    with path.open("r", encoding="utf-8") as config_file:
        return yaml.safe_load(config_file)


def run(config: dict) -> None:
    """Run continuous paper trading against Binance candles."""
    logger = setup_logger(config)
    database = BotDatabase(config["storage"]["database_path"])
    data_client = BinanceDataClient()
    strategy = MeanReversionStrategy(config)
    broker = PaperBroker(config, database)

    logger.info("Paper trading indult: %s %s", config["symbol"], config["timeframe"])
    while True:
        try:
            candles = data_client.fetch_ohlcv(
                config["symbol"],
                config["timeframe"],
                limit=config.get("lookback_limit", 500),
            )
            enriched = add_indicators(candles, config)
            latest = enriched.iloc[-1]
            timestamp = latest["timestamp"].isoformat()
            close = float(latest["close"])

            if broker.open_position is None:
                signal = strategy.evaluate_entry(latest)
                if signal.action == "buy":
                    broker.buy(close, timestamp, signal.reason, signal.stop_price)
                    logger.info("ENTRY %s price=%.4f reason=%s", config["symbol"], close, signal.reason)
            else:
                signal = strategy.evaluate_exit(latest, broker.open_position)
                if signal.action == "sell":
                    exit_price = (
                        float(broker.open_position.get("stop_price") or close)
                        if "stop" in signal.reason.lower()
                        else close
                    )
                    trade = broker.sell(exit_price, timestamp, signal.reason)
                    logger.info(
                        "EXIT %s price=%.4f pnl=%.4f reason=%s",
                        config["symbol"],
                        exit_price,
                        trade["realized_pnl"],
                        signal.reason,
                    )

            broker.record_equity(timestamp, close)
        except Exception as error:
            logger.exception("Futtatási hiba: %s", error)
            database.insert("errors", {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "message": str(error), "context": "main_loop"})

        time.sleep(config.get("poll_seconds", 60))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="SOL mean reversion paper trading bot")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG_PATH, help="YAML konfiguráció útvonala")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(load_config(args.config))
