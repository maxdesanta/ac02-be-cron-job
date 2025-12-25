"use strict";

const { query } = require("../config/db");

class AuthenticationModel {
  static async addToken(token, userId) {
    const sql = "INSERT INTO authentications (token, user_id) VALUES ($1, $2)";
    try {
      await query(sql, [token, userId]);
    } catch (err) {
      console.log(err.message);
    }
  }

  static async findToken(token) {
    const sql = "SELECT * FROM authentications WHERE token = $1";
    try {
      const result = await query(sql, [token]);
      return result.rows[0];
    } catch (err) {
      console.log(err.message);
    }
  }

  static async deleteToken(token) {
    const sql = "DELETE FROM authentications WHERE token = $1";
    try {
      await query(sql, [token]);
    } catch (err) {
      console.log(err.message);
    }
  }
}

module.exports = { AuthenticationModel };
