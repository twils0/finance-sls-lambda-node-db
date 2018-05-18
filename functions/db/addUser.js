// add a new user to the database
module.exports.addUser = async (payload) => {
  const { email } = payload;
  let emailAdditional = null;
  let userId = null;

  if (payload.emailAdditional) {
    ({ emailAdditional } = payload);
  }

  try {
    let response = null;

    response = await global.pool.query(
      `INSERT INTO "user"."user" (email, email_additional)
      VALUES($1::text, $2::text) RETURNING user_id;`,
      [email, emailAdditional],
    );

    userId = response.rows[0].user_id;
  } catch (errorCatch) {
    return Promise.reject(errorCatch);
  }

  return { userId };
};
