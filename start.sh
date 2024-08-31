#!/bin/sh
start_timer() {
    echo "Timer started."
    start_time=$(date +%s)
    start_at=$(date)
}

stop_timer() {
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    echo "datetime: ${start_at} Timer stopped. Duration: ${duration} seconds."
}

start_timer
bun --env-file=/root/rvlz/.env  /root/rvlz/index.ts
stop_timer
