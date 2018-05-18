const uuidv4 = require('uuid/v4');

// update a user's email and/or emailAdditional; set a uuid in
// the email_ver and/or email_additional_ver columns, for use
// later when verifying a user's email and/or emailAdditional;
// or, verify a user's email and/or emailAdditional,
// by looking for a provided uuid in the email_ver or
// email_additional_ver columns and deleting the uuid,
// when found
module.exports.updateUser = async (userId, body) => {
  const { email, verificationId } = body;
  let username = null;
  let emailVerificationId = null;
  let emailAdditionalVerificationId = null;

  try {
    if (email) {
      const response = await global.pool.query(
        `SELECT email
        FROM "user"."user"
        WHERE user_id = $1::uuid;`,
        [userId],
      );

      if (response.rows.length > 0) {
        username = response.rows[0].email;
      }
    }

    if (email && Object.prototype.hasOwnProperty.call(body, 'emailAdditional')) {
      let emailAdditional = null;

      if (body.emailAdditional) {
        ({ emailAdditional } = body);
      }

      await global.pool.query(
        `UPDATE "user"."user" SET
      email = $2::text,
      email_additional = $3::text
      WHERE user_id = $1::uuid;`,
        [userId, email, emailAdditional],
      );
    } else if (email) {
      await global.pool.query(
        `UPDATE "user"."user" SET
      email = $2::text
      WHERE user_id = $1::uuid;`,
        [userId, email],
      );
    } else if (Object.prototype.hasOwnProperty.call(body, 'emailAdditional')) {
      let emailAdditional = null;

      if (body.emailAdditional) {
        ({ emailAdditional } = body);
      }

      const response = await global.pool.query(
        `UPDATE "user"."user" SET
      email_additional = $2::text
      WHERE user_id = $1::uuid
      RETURNING email;`,
        [userId, emailAdditional],
      );

      if (response.rows.length > 0) {
        username = response.rows[0].email;
      }
    } else if (
      Object.prototype.hasOwnProperty.call(body, 'emailVerified') &&
      Object.prototype.hasOwnProperty.call(body, 'emailAdditionalVerified') &&
      body.emailVerified !== 'true' &&
      body.emailAdditionalVerified !== 'true'
    ) {
      const response = await global.pool.query(
        `SELECT email, email_ver, email_additional_ver
        FROM "user"."user"
        WHERE user_id = $1::uuid;`,
        [userId],
      );

      if (response.rows.length > 0) {
        username = response.rows[0].email;
        emailVerificationId = response.rows[0].email_ver;
        emailAdditionalVerificationId = response.rows[0].email_additional_ver;
      }

      if (!emailVerificationId) {
        emailVerificationId = uuidv4();
      }
      if (!emailAdditionalVerificationId) {
        emailAdditionalVerificationId = uuidv4();
      }

      if (!emailVerificationId || !emailAdditionalVerificationId) {
        await global.pool.query(
          `UPDATE "user"."user" SET
          email_ver = $2::uuid,
          email_additional_ver = $3::uuid
          WHERE user_id = $1::uuid;`,
          [userId, emailVerificationId, emailAdditionalVerificationId],
        );
      }
    } else if (
      Object.prototype.hasOwnProperty.call(body, 'emailVerified') &&
      body.emailVerified !== 'true'
    ) {
      const response = await global.pool.query(
        `SELECT email, email_ver
        FROM "user"."user"
        WHERE user_id = $1::uuid;`,
        [userId],
      );

      if (response.rows.length > 0) {
        username = response.rows[0].email;
        emailVerificationId = response.rows[0].email_ver;
      }

      if (!emailVerificationId) {
        emailVerificationId = uuidv4();

        await global.pool.query(
          `UPDATE "user"."user" SET
          email_ver = $2::uuid
          WHERE user_id = $1::uuid;`,
          [userId, emailVerificationId],
        );
      }
    } else if (
      Object.prototype.hasOwnProperty.call(body, 'emailAdditionalVerified') &&
      body.emailAdditionalVerified !== 'true'
    ) {
      const response = await global.pool.query(
        `SELECT email, email_additional_ver
        FROM "user"."user"
        WHERE user_id = $1::uuid;`,
        [userId],
      );

      if (response.rows.length > 0) {
        username = response.rows[0].email;
        emailAdditionalVerificationId = response.rows[0].email_additional_ver;
      }

      if (!emailAdditionalVerificationId) {
        emailAdditionalVerificationId = uuidv4();

        await global.pool.query(
          `UPDATE "user"."user" SET
          email_additional_ver = $2::uuid
          WHERE user_id = $1::uuid;`,
          [userId, emailAdditionalVerificationId],
        );
      }
    } else if (verificationId) {
      let userIdVer = null;

      const userResponse = await global.pool.query(
        `UPDATE "user"."user" 
      SET email_ver = CASE WHEN email_ver = $1::uuid
      THEN NULL ELSE email_ver END,
      email_additional_ver = CASE WHEN email_additional_ver = $1::uuid
      THEN NULL ELSE email_additional_ver END
      WHERE email_ver = $1::uuid
      OR email_additional_ver = $1::uuid
      RETURNING user_id;`,
        [verificationId],
      );

      if (userResponse.rows.length > 0) {
        userIdVer = userResponse.rows[0].user_id;
      }

      if (userIdVer) {
        const userResponse2 = await global.pool.query(
          `SELECT email, email_ver, email_additional_ver
        FROM "user"."user"
        WHERE user_id = $1::uuid`,
          [userIdVer],
        );

        if (userResponse2.rows.length > 0) {
          username = userResponse2.rows[0].email;
          emailVerificationId = userResponse2.rows[0].email_ver;
          emailAdditionalVerificationId = userResponse2.rows[0].email_additional_ver;
        }
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return { username, emailVerificationId, emailAdditionalVerificationId };
};
