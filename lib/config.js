const config = require('@agilemd/config');

module.exports = config({
  AWS_REGION: { $env: 'AD_AWS_REGION', default: 'us-east-1' },
  DB_INSTANCE_IDENTIFIER: { $env: 'DB_INSTANCE_IDENTIFIER' },
  GLACIER_VAULT_NAME: { $env: 'GLACIER_VAULT_NAME' }
});
