// delete the user from the database
module.exports.deleteUser = async (userId) => {
  try {
    await global.pool.query(
      `DELETE FROM "user"."join_user_security"
          WHERE user_id = $1::uuid;`,
      [userId],
    );

    await global.pool.query(
      `DELETE FROM "user"."user"
        WHERE user_id = $1::uuid;`,
      [userId],
    );
  } catch (error) {
    return Promise.reject(error);
  }

  return null;
};
