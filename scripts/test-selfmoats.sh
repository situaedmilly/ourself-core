#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
node --test runtime/selfmoats/identity/test/*.test.mjs runtime/selfmoats/help/test/*.test.mjs
