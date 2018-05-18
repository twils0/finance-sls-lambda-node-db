// get the current (last viewed) securityId,
// the list of securityIds to which the user is subscribed,
// and objects for each security, with basic information
// related to that security
module.exports.getSecurities = async (userId) => {
  const securities = {};
  let current = null;
  const list = [];

  try {
    const joinResponse = await global.pool.query(
      `SELECT security_id, security_order
        FROM "user"."join_user_security"
        WHERE user_id = $1::uuid;`,
      [userId],
    );

    if (joinResponse.rows.length > 0) {
      joinResponse.rows.forEach(({ security_id, security_order }) => {
        list[security_order] = security_id;
      });

      const securityResponse = await global.pool.query(
        `SELECT security_id, name, exchange, ticker_cusip, category
        FROM security.security
        WHERE security_id IN (SELECT(UNNEST($1::uuid[])));`,
        [list],
      );

      if (securityResponse.rows.length > 0) {
        securityResponse.rows.forEach((row) => {
          securities[row.security_id] = {
            id: row.security_id,
            name: row.name,
            exchange: row.exchange,
            tickerCusip: row.ticker_cusip,
            category: row.category,
          };
        });

        const userResponse = await global.pool.query(
          `SELECT security_current FROM "user"."user"
        WHERE user_id = $1::uuid;`,
          [userId],
        );

        if (userResponse.rows.length > 0) {
          current = userResponse.rows[0].security_current;
        }
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }

  if (list.length > 0 && list.indexOf(current) === -1) {
    [current] = list;
  }

  securities.current = current;
  securities.list = list;
  return { securities };
};
