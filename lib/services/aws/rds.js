const AWS = require('aws-sdk');

const config = require('../../config');

AWS.config.update({ region: config('AWS_REGION') });

const rds = new AWS.RDS();
const DB_INSTANCE_IDENTIFIER = config('DB_INSTANCE_IDENTIFIER');

function describeLogFiles({ lastWritten } = {}) {
  return new Promise((resolve, reject) => {
    rds.describeDBLogFiles({
      DBInstanceIdentifier: DB_INSTANCE_IDENTIFIER,
      FileLastWritten: lastWritten
    }, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

function downloadDBLogFilePortion(filename, marker) {
  return new Promise((resolve, reject) => {
    rds.downloadDBLogFilePortion({
      DBInstanceIdentifier: DB_INSTANCE_IDENTIFIER,
      LogFileName: filename,
      Marker: marker,
      NumberOfLines: '10000'
    }, (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

module.exports = {
  describeLogFiles,
  downloadDBLogFilePortion
};
