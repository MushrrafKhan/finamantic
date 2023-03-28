const AWS = require('aws-sdk');
const uuid = require('uuid/v4');

const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
const region = process.env.AWS_S3_REGION;
const bucket = process.env.AWS_S3_BUCKET;

AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    ACL: 'public-read',
});
const s3 = new AWS.S3();

const S3_BASE = `https://${bucket}.s3.${region}.amazonaws.com/`;

const getSignedUrl = (location, extension) =>
    new Promise((resolve, reject) => {
        const key = `${location}${uuid()}.${extension}`;
        s3.getSignedUrl(
            'putObject',
            {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                ACL: 'public-read',
            },
            (err, data) => {
                if (err) return reject(err);
                resolve({
                    url: data,
                    preview: `${S3_BASE}${key}`,
                });
            }
        );
    });

module.exports = {
    getSignedUrl,
};
