"use strict";

const { query } = require("../config/db");
const InvariantError = require("../exeptions/InvariantError");
const { hashPassword, verifyPass } = require("../helper/passEncrypt");
const { AuthenticationModel } = require("./AuthenticationModel");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../helper/tokenManager");
const webToken = require("jsonwebtoken");

class UserModel {
  constructor(username, email) {
    this.username = username;
    this.email = email;
  }

  // register
  static async RegisterModel(username, email, password) {
    const textQuery =
      "INSERT INTO engineers (username, email, password) VALUES ($1, $2, $3) RETURNING id";
    
    try {
      const hashPass = await hashPassword(password);

      const createStatus = await query(textQuery, [username, email, hashPass]);

      if (createStatus) {
        return "user created";
      }
    } catch (err) {
      console.log(err.message);
    }
  }

  // login
  static async LoginModel(email, password) {
    try {
      const user = await UserModel.FindUserByEmail(email);

      if (!user) {
        throw new InvariantError("user not found");
      }

      const isMatch = await verifyPass(password, user.password);

      if (!isMatch) {
        throw new InvariantError("password not match");
      }

      const accessToken = generateAccessToken({ id: user.id });
      const refreshToken = generateRefreshToken({ id: user.id });
      await AuthenticationModel.addToken(refreshToken, user.id);

      return {
        user: true,
        isMatch,
        accessToken,
        refreshToken,
        message: "login success",
      };
    } catch (err) {
      console.log(err.message);
    }
  }

  // profile
  static async profileModel(id) {
    const textQuery = "SELECT username, email FROM engineers WHERE id = $1;";
    try {
      const { rows } = await query(textQuery, [id]);

      return rows.map((row) => new UserModel(row.username, row.email));
    } catch (err) {
      console.log(err.message);
    }
  }

  // findUser by email
  static async FindUserByEmail(email) {
    const textQuery = "SELECT * FROM engineers WHERE email = $1";
    try {
      const result = await query(textQuery, [email]);
      const user = result.rows[0];
      return user;
    } catch (err) {
      console.log(err.message);
    }
  }

  static async RefreshTokenModel(refreshToken) {
    try {
      const tokenInDB = await AuthenticationModel.findToken(refreshToken);

      if (!tokenInDB) {
        throw new InvariantError("refresh token not found");
      }

      const decoded = webToken.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
      const newAccessToken = generateAccessToken({ id: decoded.id });

      return {
        accessToken: newAccessToken,
        message: "refresh token success",
      };
    } catch (err) {
      // Tangani error jika token tidak valid (kadaluarsa, salah signature, dll.)
      if (err instanceof webToken.JsonWebTokenError) {
        throw new InvariantError('Invalid refresh token or token expired.');
      }
      // Tangani error lainnya
      console.log(err.message);
      throw err;
    }
  }
}

module.exports = { UserModel };
