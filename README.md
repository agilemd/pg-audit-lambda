# Lambda PG Audit

This repo allows one to deploy a cloud formation stack with a lambda function that will automatically backup `pg_audit` logs from an AWS `rds` instance. Every 24 hours the lambda will turn on, and download all logs that have been written to in the last 24 hours, except for the most recent log. It will then compress those files, and upload them as an archive to AWS glacier. It does not download the most recently modified log, because that log file is not complete (yet), and we don't want to download and upload duplicate data.

This repo also provides a helpful utility script for installing `pg_audit` on AWS RDS.

## Required AWS Resources
Before deploying you must create the following resources:
- AWS Glacier Vault (in the same region as the RDS instance)
- AWS RDS Instance (Postgres or Aurora)
- AWS S3 Bucket (for storing the packaged lambda)

## Required environment variables
| Variable | Description |
| --- | --- |
| `DB_INSTANCE_IDENTIFIER` | The RDS identifier for the database |
| `DB_INSTANCE_ARN` | The ARN for the RDS instance |
| `GLACIER_VAULT_NAME` | The name of the glacier vault in which to store the logs. |
| `GLACIER_VAULT_ARN` | The ARN of the glacier vault in which to store the logs. |
| `LAMBDA_BUCKET` | The name of the S3 bucket you created to be used to store the packaged lambda. |


# Reference

## Installing PG Audit
- [Docs](/docs/pg_audit_setup)

### Build and deploy

Run the following NPM command to build lambdas and CloudFormation template

```sh
$ npm run build
```

Run the following script to deploy the CloudFormation

```sh
$ npm run deploy
```
