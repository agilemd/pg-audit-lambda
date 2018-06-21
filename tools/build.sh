#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR=$(dirname "$SCRIPT_DIR")
BUILD_DIR=$PROJECT_DIR/dist

echo "[pg-audit] build init"

# [JR] save the initial node env for later restoration
NODE_ENV_INIT=$NODE_ENV
# [JR] switch to production, so we only install prod dependencies
export NODE_ENV="production"

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
echo "[pg-audit] installing production node_modules"
cp  $PROJECT_DIR/package.json $BUILD_DIR
npm install --prefix $BUILD_DIR

# # [JR] restore the initial node env configuration
export NODE_ENV=$NODE_ENV_INIT
#
echo "[pg-audit] copying source"
cp -r $PROJECT_DIR/lib $BUILD_DIR
cp -r $PROJECT_DIR/lambda $BUILD_DIR

echo "[pg-audit] creating index.js"
touch $BUILD_DIR/index.js
for lambda in $(ls $PROJECT_DIR/lambda/*.js -a1 | xargs -n 1 basename);
do
  lambda=${lambda%???} # remove .js
  echo "exports.${lambda} = require('./lambda/${lambda}');" >> $BUILD_DIR/index.js
done

# generate the org specific template
echo '[pg-audit] generating org specific template.yml'
node $PROJECT_DIR/tools/generateTemplate.js

echo "[pg-audit] build done"
