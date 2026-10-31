#!/usr/bin/env sh
set -eu

# Build the Android project with caches kept inside the repo.
#
# Gradle normally writes to ~/.gradle and the debug keystore to ~/.android.
# On locked-down machines (containers, sandboxes) those paths are read-only,
# so this script defaults both to repo-local directories. Export the
# variables yourself to use different locations.

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$ROOT_DIR/.gradle-home}"
export ANDROID_USER_HOME="${ANDROID_USER_HOME:-$ROOT_DIR/.android-user}"

if [ ! -f "$ROOT_DIR/android/local.properties" ] && [ -n "${ANDROID_HOME:-}" ]; then
  printf 'sdk.dir=%s\n' "$ANDROID_HOME" > "$ROOT_DIR/android/local.properties"
fi

if [ "$#" -eq 0 ]; then
  set -- assembleDebug
fi

cd "$ROOT_DIR/android"
exec ./gradlew "$@" --no-daemon
