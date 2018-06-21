const AWS = require('aws-sdk');
const ms = require('ms');
const series = require('p-series');
const { Readable } = require('stream');
const debug = require('debug')('@agilemd/pg-audit-lambda');

const rds = require('../lib/services/aws/rds');
const glacier = require('../lib/services/aws/glacier');

const UPLOAD_PART_SIZE = 1024 * 1024;

function downloadLogFile(filename, stream, { marker = '0' } = {}) {
  return rds.downloadDBLogFilePortion(filename, marker)
  .then((data) => {
    stream.push(data.LogFileData);

    debug('downloaded part of: %s Marker: %s', filename, marker);
    if (data.AdditionalDataPending) {
      return downloadLogFile(filename, stream, { marker: data.Marker });
    }

    return null;
  });
}

function handleNewData(raw, chunk, tasks, hashes, uploadId) {
  let buffer = Buffer.from(raw);
  const size = buffer.length;
  const offset = UPLOAD_PART_SIZE - size;

  buffer = Buffer.concat([buffer, chunk.slice(0, offset)]);

  if (buffer.length === UPLOAD_PART_SIZE) {
    const first = tasks.length * UPLOAD_PART_SIZE;
    const range = `bytes ${first}-${(first + buffer.length) - 1}/*`;
    hashes.push(AWS.util.crypto.sha256(buffer));

    tasks.push(glacier.uploadMultipartPart(uploadId, range, Buffer.from(buffer)));

    buffer = chunk.slice(offset);
  }

  return buffer;
}

function lambda(event, context, callback) {
  const lastWritten = Date.now() - ms('61m');

  return rds.describeLogFiles({ lastWritten })
  .then(({ DescribeDBLogFiles }) => DescribeDBLogFiles.slice(-1))
  .then(({ DescribeDBLogFiles }) =>
    DescribeDBLogFiles.map(({ LogFileName }) => LogFileName)
    .filter(filename => !filename.endsWith('gz'))
  )
  .then(filenames => series(filenames.map(filename => () => {
    debug('downloading: %s', filename);
    const hashes = [];
    let uploadId;
    let archiveSize;

    return glacier.initiateMultipartUpload(`${UPLOAD_PART_SIZE}`)
    .then(data => new Promise((resolve, reject) => {
      const tasks = [];
      const stream = new Readable({ read() {} });
      let buffer = Buffer.alloc(0);

      uploadId = data.uploadId;

      stream.on('data', (chunk) => {
        if (chunk) {
          buffer = handleNewData(buffer, chunk, tasks, hashes, uploadId);
        }
      });

      stream.on('end', () => {
        const first = tasks.length * UPLOAD_PART_SIZE;
        const range = `bytes ${first}-${(first + buffer.length) - 1}/*`;
        archiveSize = `${first + buffer.length}`;

        tasks.push(glacier.uploadMultipartPart(uploadId, range, Buffer.from(buffer)));
        hashes.push(AWS.util.crypto.sha256(buffer));

        debug('finished downloading: %s size: %sMB', filename, (archiveSize / 1024 / 1024));
        resolve(Promise.all(tasks));
      });

      downloadLogFile(filename, stream)
      .then(() => stream.push(null))
      .catch(reject);
    }))
    .then(() => glacier.buildHashTree(hashes))
    .then(checksum => glacier.completeMultipartUpload(uploadId, checksum, archiveSize))
    .then(({ archiveId }) => debug('finished file: %s archiveId: %s', filename, archiveId));
  })))
  .then(() => callback())
  .catch(callback);
}

module.exports = lambda;
