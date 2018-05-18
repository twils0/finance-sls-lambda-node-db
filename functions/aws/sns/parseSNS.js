// used to parse an SNS event; returning the sns message
module.exports.parseSNS = async (event) => {
  if (
    !event ||
    !event.Records ||
    event.Records.length === 0 ||
    !event.Records[0].Sns ||
    !event.Records[0].Sns.Message
  ) {
    return Promise.reject('unexpected error - invalid sns event');
  }

  const snsPayload = JSON.parse(event.Records[0].Sns.Message);

  return snsPayload;
};
