"""Console and file logging setup."""

from __future__ import annotations

import logging
from pathlib import Path


def setup_logger(config: dict) -> logging.Logger:
    """Configure and return the bot logger."""
    logging_config = config.get("logging", {})
    log_level = getattr(logging, logging_config.get("level", "INFO").upper(), logging.INFO)
    logger = logging.getLogger("sol_mean_reversion_bot")
    logger.setLevel(log_level)
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    file_path = logging_config.get("file_path")
    if file_path:
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(path)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger
