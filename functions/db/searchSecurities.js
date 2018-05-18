// use postgresql's full text search to search for securities
// across tickerCusip, name, category, and exchange
module.exports.searchSecurities = async (query) => {
  const { search } = query;
  const securities = [];

  try {
    const response = await global.pool.query(
      `SELECT security_id, name, exchange, ticker_cusip, category
        FROM security.security
        WHERE security_tsv @@ to_tsquery($1::text)
        ORDER BY ts_rank_cd(security_tsv, to_tsquery($1::text))
        DESC LIMIT 20;`,
      [`${search}:*`],
    );

    response.rows.forEach((row) => {
      securities.push({
        id: row.security_id,
        name: row.name,
        exchange: row.exchange,
        tickerCusip: row.ticker_cusip,
        category: row.category,
      });
    });
  } catch (error) {
    return Promise.reject(error);
  }

  return { securities };
};
