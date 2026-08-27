#!/usr/bin/env bash

set -euo pipefail

redis_url="${REDIS_URL:-redis://localhost:6379}"
redis_password="${REDIS_PASSWORD:-}"
redis_location="${redis_url#*@}"
redis_location="${redis_location#redis://}"
redis_cli_url="${redis_url/redis:\/\/:/redis:\/\/default:}"

redis_is_ready() {
	[[ "$(redis-cli --raw -u "$redis_cli_url" ping 2> /dev/null)" == "PONG" ]]
}

if ! command -v redis-cli &> /dev/null; then
	echo "redis-cli is required to run pnpm dev. Install Redis and try again." >&2
	exit 1
fi

if redis_is_ready; then
	exit 0
fi

redis_ping_output=$(redis-cli --raw -u "$redis_cli_url" ping 2>&1 || true)
if [[ "$redis_ping_output" == *"NOAUTH"* || "$redis_ping_output" == *"WRONGPASS"* ]]; then
	if command -v systemctl &> /dev/null && systemctl is-active --quiet redis-server; then
		echo "The systemd redis-server service is running at $redis_location, but REDIS_PASSWORD was rejected. Update REDIS_PASSWORD to match /etc/redis/redis.conf or reconfigure the service." >&2
	else
		echo "Redis is running at $redis_location, but REDIS_PASSWORD was rejected. Stop that Redis instance or update REDIS_PASSWORD." >&2
	fi
	exit 1
fi

if ! command -v redis-server &> /dev/null; then
	echo "redis-server is required to run pnpm dev. Install Redis and try again." >&2
	exit 1
fi

redis_server_args=(--daemonize yes)
if [[ -n "$redis_password" ]]; then
	redis_server_args+=(--requirepass "$redis_password")
fi
redis-server "${redis_server_args[@]}"

for _ in {1..10}; do
	if redis_is_ready; then
		exit 0
	fi
	done

echo "redis-server did not become ready at $redis_url." >&2
exit 1
