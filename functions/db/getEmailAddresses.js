// get the primary and additional email addresses of all users
// that have subscribed to the tickerCusip provided; return
// these email addresses as an array of strings
module.exports.getEmailAddresses = async (tickerCusip) => {
  let securityId = null;
  const emailAddresses = [];

  try {
    const securityReponse = await global.pool.query(
      `SELECT security_id
      FROM security.security
      WHERE ticker_cusip = $1::text`,
      [tickerCusip],
    );

    if (securityReponse.rows.length > 0) {
      securityId = securityReponse.rows[0].security_id;
    } else {
      return Promise.reject('unexpected error - ticker not found');
    }

    if (securityId) {
      const joinReponse = await global.pool.query(
        `SELECT email, email_additional
        FROM "user"."user"
        WHERE user_id in (
        SELECT user_id
        FROM "user".join_user_security
        WHERE security_id = $1::uuid);`,
        [securityId],
      );

      if (joinReponse.rows.length > 0) {
        joinReponse.rows.forEach((row) => {
          emailAddresses.push(row.email);
          if (row.email_additional) {
            emailAddresses.push(row.email_additional);
          }
        });
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return { emailAddresses };
};
