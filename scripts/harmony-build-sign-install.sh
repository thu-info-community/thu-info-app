#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/harmony-build-sign-install.sh [options]

Build, sign, verify, and install the HarmonyOS debug HAP. The build runs in a
persistent temporary copy so Harmony-specific dependency preparation does not
rewrite the source checkout.

Options:
  --no-install       Build, sign, and verify without installing.
  --device SERIAL    Install to a specific HDC device.
  -h, --help         Show this help.

Environment overrides:
  HARMONY_TOOLS_HOME  HarmonyOS command-line tools directory.
  HARMONY_BUILD_REPO  Persistent temporary build checkout.
  NODE_BIN            Node.js executable.
  SIGNING_DIR         Directory containing the signing material.
  KEY_ALIAS           Keystore alias (default: thuinfo-debug).
  KEYSTORE_FILE       P12 keystore path.
  CERT_FILE           Huawei developer certificate path.
  PROFILE_FILE        Huawei debug Profile path.
  PASSWORD_FILE       File containing the keystore/key password.
  SIGNED_HAP_OUTPUT   Final signed HAP path.
EOF
}

install_app=1
device_serial=''

while (($# > 0)); do
  case "$1" in
    --no-install)
      install_app=0
      shift
      ;;
    --device)
      if (($# < 2)); then
        echo 'Missing serial after --device.' >&2
        exit 2
      fi
      device_serial="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
source_harmony_dir="$repo_root/apps/thu-info-app/harmony"

tools_home="${HARMONY_TOOLS_HOME:-/home/ajax/harmonyos-commandline-tools}"
build_repo="${HARMONY_BUILD_REPO:-${TMPDIR:-/tmp}/thu-info-harmony-build/repo}"
default_node=/home/ajax/.local/share/pnpm/node
if [[ -x "$default_node" ]]; then
  node_bin="${NODE_BIN:-$default_node}"
else
  node_bin="${NODE_BIN:-$(command -v node || true)}"
fi

signing_dir="${SIGNING_DIR:-$source_harmony_dir/signing}"
key_alias="${KEY_ALIAS:-thuinfo-debug}"
keystore_file="${KEYSTORE_FILE:-$signing_dir/thuinfo-debug.p12}"
cert_file="${CERT_FILE:-$signing_dir/thuinfo-debug.cer}"
profile_file="${PROFILE_FILE:-$signing_dir/DevDebug.p7b}"
password_file="${PASSWORD_FILE:-$signing_dir/.keystore-password}"
signed_hap="${SIGNED_HAP_OUTPUT:-$signing_dir/thuinfo-debug-signed.hap}"

hvigor="$tools_home/bin/hvigorw"
hdc="$tools_home/sdk/default/openharmony/toolchains/hdc"
sign_tool="$tools_home/sdk/default/openharmony/toolchains/lib/hap-sign-tool.jar"

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Required file not found: $1" >&2
    exit 1
  fi
}

require_executable() {
  if [[ ! -x "$1" ]]; then
    echo "Required executable not found: $1" >&2
    exit 1
  fi
}

if [[ -z "$node_bin" ]]; then
  echo 'Node.js was not found. Set NODE_BIN to its executable.' >&2
  exit 1
fi

require_executable "$node_bin"
require_executable "$hvigor"
require_executable "$hdc"
require_file "$sign_tool"
require_file "$keystore_file"
require_file "$cert_file"
require_file "$profile_file"
require_file "$password_file"

if ! command -v rsync >/dev/null 2>&1; then
  echo 'rsync is required to prepare the temporary build checkout.' >&2
  exit 1
fi

case "$build_repo/" in
  "$repo_root/"*)
    echo 'HARMONY_BUILD_REPO must be outside the source checkout.' >&2
    exit 1
    ;;
esac

node_bin="$(readlink -f "$node_bin")"
node_home="$(cd "$(dirname "$node_bin")/.." && pwd)"
export PATH="$tools_home/bin:$(dirname "$node_bin"):$PATH"

mkdir -p "$build_repo"
rsync -a --delete \
  --exclude '/.git/' \
  --exclude '/node_modules/' \
  --exclude '/apps/thu-info-app/harmony/oh_modules/' \
  --exclude '/apps/thu-info-app/harmony/entry/oh_modules/' \
  --exclude '/apps/thu-info-app/harmony/entry/build/' \
  --exclude '/apps/thu-info-app/harmony/.hvigor/' \
  --exclude '/apps/thu-info-app/harmony/secrets.env' \
  --exclude '/apps/thu-info-app/harmony/signing/' \
  "$repo_root/" "$build_repo/"

harmony_dir="$build_repo/apps/thu-info-app/harmony"
app_json="$harmony_dir/AppScope/app.json5"
build_profile="$harmony_dir/build-profile.json5"
hvigor_config="$harmony_dir/hvigor/hvigor-config.json5"
output_dir="$harmony_dir/entry/build/default/outputs/default"
unsigned_hap="$output_dir/entry-default-unsigned.hap"

require_file "$build_repo/setup-harmony.sh"
require_file "$app_json"
require_file "$build_profile"
require_file "$hvigor_config"

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/thuinfo-harmony-sign.XXXXXX")"
profile_report="$work_dir/profile.json"
trap 'rm -rf "$work_dir"' EXIT

java -jar "$sign_tool" verify-profile \
  -inFile "$profile_file" \
  -outFile "$profile_report"

bundle_name="$($node_bin -e "const fs=require('fs');const report=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));if(!report.verifiedPassed)process.exit(1);process.stdout.write(report.content['bundle-info']['bundle-name']);" "$profile_report")"
if [[ -z "$bundle_name" ]]; then
  echo 'The debug Profile does not contain a bundle name.' >&2
  exit 1
fi

echo 'Preparing HarmonyOS dependencies and generated sources.'
(
  cd "$build_repo"
  ./setup-harmony.sh
  yarn workspace @thu-info/app bundle-harmony
)

"$node_bin" -e "const fs=require('fs');const p=process.argv[1];const bundle=process.argv[2];const source=fs.readFileSync(p,'utf8');const next=source.replace(/(\"bundleName\"\s*:\s*\")[^\"]+(\")/,(_,a,b)=>a+bundle+b);if(next===source)throw new Error('bundleName not found');fs.writeFileSync(p,next);" "$app_json" "$bundle_name"
"$node_bin" -e "const fs=require('fs');const p=process.argv[1];const source=fs.readFileSync(p,'utf8');const next=source.replace(/(\"dependencies\"\s*:\s*)\{[\s\S]*?\n\s*\}(?=\s*,\s*\"execution\")/,(_,prefix)=>prefix+'{}');if(next===source)throw new Error('dependencies block not found');fs.writeFileSync(p,next);" "$hvigor_config"
"$node_bin" -e "const fs=require('fs');const p=process.argv[1];const source=fs.readFileSync(p,'utf8');const next=source.replace(/\n\s*\"signingConfig\"\s*:\s*\"default\",/,'');if(next===source)throw new Error('product signingConfig not found');fs.writeFileSync(p,next);" "$build_profile"

echo "Building $bundle_name"
(
  cd "$harmony_dir"
  THUINFO_HARMONY_MANUAL_SIGN=1 \
  DEVECO_NODE_HOME="$node_home" \
  NODE_HOME="$node_home" \
    "$hvigor" assembleHap \
      --mode module \
      -p module=entry@default \
      -p product=default \
      --no-daemon
)

require_file "$unsigned_hap"
IFS= read -r signing_password < "$password_file"
if [[ -z "$signing_password" ]]; then
  echo "Password file is empty: $password_file" >&2
  exit 1
fi

rm -f "$signed_hap"
java -jar "$sign_tool" sign-app \
  -mode localSign \
  -keyAlias "$key_alias" \
  -keyPwd "$signing_password" \
  -appCertFile "$cert_file" \
  -profileFile "$profile_file" \
  -inFile "$unsigned_hap" \
  -signAlg SHA256withECDSA \
  -keystoreFile "$keystore_file" \
  -keystorePwd "$signing_password" \
  -outFile "$signed_hap" \
  -compatibleVersion 12
unset signing_password

java -jar "$sign_tool" verify-app \
  -inFile "$signed_hap" \
  -outCertChain "$work_dir/cert-chain.cer" \
  -outProfile "$work_dir/profile.p7b"

if ((install_app)); then
  if [[ -n "$device_serial" ]]; then
    "$hdc" -t "$device_serial" install -r "$signed_hap"
  else
    target_count="$($hdc list targets | sed '/^[[:space:]]*$/d' | wc -l)"
    if [[ "$target_count" -ne 1 ]]; then
      echo "Expected one HDC device, found $target_count. Pass --device SERIAL." >&2
      exit 1
    fi
    "$hdc" install -r "$signed_hap"
  fi
fi

echo "Signed HAP: $signed_hap"
if ((install_app)); then
  echo "Installed bundle: $bundle_name"
else
  echo 'Installation skipped.'
fi
