const { deepEqual } = require('fast-equals');

// update the current (last viewed) securityId
// and the list of securities to which a user is subscribed
module.exports.updateSecurities = async (userId, body) => {
  try {
    const { current, list } = body;
    let securityCurrent = null;
    let joinList = [];

    const userResponse = await global.pool.query(
      `SELECT security_current FROM "user"."user"
          WHERE user_id = $1::uuid;`,
      [userId],
    );

    if (userResponse.rows.length > 0) {
      securityCurrent = userResponse.rows[0].security_current;
    }

    const joinResponse = await global.pool.query(
      `SELECT security_id FROM "user"."join_user_security"
          WHERE user_id = $1::uuid;`,
      [userId],
    );

    if (joinResponse.rows.length > 0) {
      joinList = joinResponse.rows.map(({ security_id }) => security_id);
    }

    if (current !== securityCurrent) {
      await global.pool.query(
        `UPDATE "user"."user"
          SET security_current = $2::uuid
          WHERE user_id = $1::uuid;`,
        [userId, current],
      );
    }

    if (!deepEqual(list, joinList)) {
      const indexArray = list.map((id, index) => index);

      await global.pool.query(
        `DELETE FROM "user"."join_user_security"
          WHERE user_id = $1::uuid;`,
        [userId],
      );

      await global.pool.query(
        `INSERT INTO "user"."join_user_security" (user_id, security_id, security_order)
          VALUES($1::uuid, UNNEST($2::uuid[]), UNNEST($3::int2[]));`,
        [userId, list, indexArray],
      );
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return null;
};
