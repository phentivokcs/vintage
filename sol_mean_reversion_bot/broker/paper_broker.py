"""Virtual broker for paper trading without sending real Binance orders."""

from __future__ import annotations

from datetime import datetime, timezone

from sol_mean_reversion_bot.storage.db import BotDatabase


class PaperBroker:
    """Track virtual cash, one open long position, fees, and trade history."""

    def __init__(self, config: dict, database: BotDatabase | None = None) -> None:
        broker_config = config["broker"]
        self.symbol = config["symbol"]
        self.cash = float(broker_config["initial_balance"])
        self.position_size_pct = float(broker_config["position_size_pct"])
        self.fee_rate = float(broker_config["fee_rate"])
        self.database = database
        self.open_position: dict | None = None

    def buy(self, price: float, timestamp: str, reason: str, stop_price: float | None) -> dict:
        """Open a long position using the configured share of cash."""
        if self.open_position is not None:
            raise ValueError("Cannot buy while a position is already open")

        notional = self.cash * self.position_size_pct
        fee = notional * self.fee_rate
        quantity = (notional - fee) / price
        self.cash -= notional

        position = {
            "opened_at": timestamp,
            "symbol": self.symbol,
            "entry_price": price,
            "quantity": quantity,
            "stop_price": stop_price,
            "status": "open",
            "position_id": None,
        }

        if self.database is not None:
            position_id = self.database.insert(
                "positions",
                {
                    "opened_at": timestamp,
                    "symbol": self.symbol,
                    "entry_price": price,
                    "quantity": quantity,
                    "stop_price": stop_price,
                    "status": "open",
                },
            )
            position["position_id"] = position_id
            self._record_trade(timestamp, "buy", price, quantity, fee, 0, reason)

        self.open_position = position
        return position

    def sell(self, price: float, timestamp: str, reason: str) -> dict:
        """Close the current long position."""
        if self.open_position is None:
            raise ValueError("Cannot sell without an open position")

        position = self.open_position
        quantity = position["quantity"]
        gross_value = quantity * price
        fee = gross_value * self.fee_rate
        net_value = gross_value - fee
        cost_basis = quantity * position["entry_price"]
        realized_pnl = net_value - cost_basis
        self.cash += net_value

        closed_position = {
            **position,
            "closed_at": timestamp,
            "exit_price": price,
            "status": "closed",
            "realized_pnl": realized_pnl,
        }

        if self.database is not None:
            self._record_trade(timestamp, "sell", price, quantity, fee, realized_pnl, reason)
            position_id = position.get("position_id")
            if position_id is not None:
                self.database.update_position_close(position_id, timestamp, price, realized_pnl)

        self.open_position = None
        return closed_position

    def equity(self, last_price: float) -> float:
        """Return cash plus marked-to-market open position value."""
        return self.cash + self.position_value(last_price)

    def position_value(self, last_price: float) -> float:
        """Return marked-to-market open position value."""
        if self.open_position is None:
            return 0.0
        return self.open_position["quantity"] * last_price

    def record_equity(self, timestamp: str, last_price: float) -> None:
        """Persist an equity snapshot."""
        if self.database is None:
            return
        self.database.insert(
            "equity_history",
            {
                "timestamp": timestamp,
                "equity": self.equity(last_price),
                "cash": self.cash,
                "position_value": self.position_value(last_price),
            },
        )

    def _record_trade(
        self,
        timestamp: str,
        side: str,
        price: float,
        quantity: float,
        fee: float,
        realized_pnl: float,
        reason: str,
    ) -> None:
        if self.database is None:
            return
        self.database.insert(
            "trades",
            {
                "timestamp": timestamp,
                "symbol": self.symbol,
                "side": side,
                "price": price,
                "quantity": quantity,
                "fee": fee,
                "realized_pnl": realized_pnl,
                "reason": reason,
            },
        )


def utc_now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()
