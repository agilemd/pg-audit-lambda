const AWS = require('aws-sdk');

const config = require('../../config');

AWS.config.update({ region: config('AWS_REGION') });

const glacier = new AWS.Glacier();
const VAULT_NAME = config('GLACIER_VAULT_NAME');

function initiateMultipartUpload(partSize) {
  return new Promise((resolve, reject) => {
    glacier.initiateMultipartUpload({
      partSize,
      vaultName: VAULT_NAME
    }, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

function uploadMultipartPart(uploadId, range, body) {
  return new Promise((resolve, reject) => {
    glacier.uploadMultipartPart({
      uploadId,
      range,
      body,
      vaultName: VAULT_NAME
    }, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

function completeMultipartUpload(uploadId, checksum, archiveSize) {
  return new Promise((resolve, reject) => {
    glacier.completeMultipartUpload({
      archiveSize,
      uploadId,
      checksum,
      vaultName: VAULT_NAME
    }, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

module.exports = {
  completeMultipartUpload,
  initiateMultipartUpload,
  uploadMultipartPart,
  buildHashTree: data => glacier.buildHashTree(data)
};
