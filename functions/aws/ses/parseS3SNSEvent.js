const { parseSNS } = require('../sns/parseSNS');

// parse an SNS event, created by SES when an email
// has been received; return the address the email
// is from (fromEmail), the domain it's from (fromDomain),
// it's subject; and, the Bucket and Key designating where
// the email itself has been saved by SES in S3
module.exports.parseS3SNSEvent = async (event) => {
  let sns = null;
  let fromEmail = null;
  let fromDomain = null;
  let subject = null;
  let Bucket = null;
  let Key = null;

  try {
    sns = await parseSNS(event);
  } catch (errorCatch) {
    return errorCatch;
  }

  if (!sns.mail || !sns.mail.commonHeaders || !sns.receipt || !sns.receipt.action) {
    return Promise.reject('unexpected error - invalid sns topic for s3 email event');
  }

  let from = null;
  ({ from, subject } = sns.mail.commonHeaders);

  if (!from || from.length === 0) {
    return Promise.reject('unexpected error - unable to find from in mail.commonHeaders');
  }

  if (!subject) {
    return Promise.reject('unexpected error - unable to find subject in mail.commonHeaders');
  }

  const [, fromSplit1] = from[0].split(/</g, 2);

  if (fromSplit1) {
    [fromEmail] = fromSplit1.split(/>/g, 2);
  }

  if (!fromEmail) {
    return Promise.reject('unexpected error - unable to parse fromEmail');
  }

  [, fromDomain] = fromEmail.split('@');

  if (!fromDomain) {
    return Promise.reject('unexpected error - unable to parse fromDomain');
  }

  Bucket = sns.receipt.action.bucketName;
  Key = sns.receipt.action.objectKey;

  if (!Bucket) {
    return Promise.reject('unexpected error - unable to find bucketName in receipt.action');
  }

  if (!Key) {
    return Promise.reject('unexpected error - unable to find objectKey in receipt.action');
  }

  return {
    fromEmail,
    fromDomain,
    subject,
    bucketParams: {
      Bucket,
      Key,
    },
  };
};
