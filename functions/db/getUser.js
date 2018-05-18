// get the user's username (email) from the database
module.exports.getUser = async (userId) => {
  let username = null;

  try {
    const response = await global.pool.query(
      `SELECT email
        FROM "user"."user"
        WHERE user_id = $1::uuid;`,
      [userId],
    );

    if (response.rows.length > 0) {
      username = response.rows[0].email;
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return { username };
};
