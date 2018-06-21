/* eslint-disable no-console */
const cwd = __dirname;

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const BUILT_PATH = path.resolve(path.join(cwd, '../dist'));
const TEMPLATE = fs.readFileSync(path.join(cwd, '../etc/sam/template.ejs'), 'ascii');
const RENDERED_TEMPLATE_PATH = path.join(cwd, '../template.yml');

const ENVIRONMENT = [
  {
    key: 'DB_INSTANCE_IDENTIFIER',
    required: true
  },
  {
    key: 'DB_INSTANCE_ARN',
    required: true
  },
  {
    key: 'GLACIER_VAULT_NAME',
    required: true
  },
  {
    key: 'GLACIER_VAULT_ARN',
    required: true
  },
  {
    key: 'AD_AWS_REGION',
    required: true
  }
];

function getEnvironmentVariable(name) {
  return process.env[name];
}

function prepareEnvironmentVariables() {
  const environment = ENVIRONMENT.map(({ key, required, defaultValue }) => {
    const value = getEnvironmentVariable(key);

    if (!value && required) {
      throw new Error(`missing required environment variable: ${key}`);
    } else if (!value && defaultValue !== undefined) {
      return { [key]: defaultValue };
    } else if (!value) {
      return {};
    }

    return { [key]: value };
  });

  return Object.assign(...environment);
}

function main() {
  const data = Object.assign(
    prepareEnvironmentVariables(),
    { buildPath: BUILT_PATH }
  );

  return new Promise((resolve, reject) => {
    const rendered = ejs.render(TEMPLATE, data);
    return fs.writeFile(RENDERED_TEMPLATE_PATH, rendered, writeErr =>
      ((writeErr) ? reject(writeErr) : resolve())
    );
  });
}

main()
.then(() => process.exit(0))
.catch((err) => {
  console.log('Error generating template: ', err);
  process.exit(1);
});
