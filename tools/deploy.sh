#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR=$(dirname "$SCRIPT_DIR")
BUILD_DIR=$PROJECT_DIR/dist

ORG_SPECIFIC_TEMPLATE_LOCATION=$PROJECT_DIR/template.yml
TEMPLATE_PACKAGED_LOCATION=${ORG_SPECIFIC_TEMPLATE_LOCATION%????}.packaged.yaml

echo "[pg-audit] deploy init"
echo "[pg-audit] - Using Deploy Bucket: $LAMBDA_BUCKET"
#
STACK_NAME="pg-audit-$DB_INSTANCE_IDENTIFIER"

echo "[pg-audit] - Stack Name: $STACK_NAME"

# zip local artifacts that are referenced by template file in (CodeUri: dist)
# upload them to the s3 bucket
echo "[pg-audit] - Packaging"
aws cloudformation package \
  --template-file $ORG_SPECIFIC_TEMPLATE_LOCATION \
  --s3-bucket $LAMBDA_BUCKET \
  --s3-prefix builds/pg-audit \
  --output-template-file $TEMPLATE_PACKAGED_LOCATION

# deploy
echo "[pg-audit] - Deploying"
aws cloudformation deploy \
  --template-file $TEMPLATE_PACKAGED_LOCATION \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --region $AD_AWS_REGION
