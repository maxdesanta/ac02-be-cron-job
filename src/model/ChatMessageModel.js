"use strict";

const { query } = require("../config/db");
const { redisClient } = require("../config/redis");
const CACHE_EXPIRATION = 3600;

class ChatMessageModel {
  constructor(id, id_engineer, message, response, timestamps) {
    this.id = id;
    this.id_engineer = id_engineer;
    this.message = message;
    this.response = response;
    this.timestamps = timestamps;
  }

  // input message
  static async inputMessageModel(id_engineer, message, response) {
    const textQuery =
      "INSERT INTO chat_message (id_engineer, message, response) VALUES ($1, $2, $3) RETURNING *;";
    const cacheKey = `chat_message:${id_engineer}`;

    try {
      const result = await query(textQuery, [id_engineer, message, response]);

      await redisClient.del(cacheKey);
      console.log(`[CACHE INVALIDATED] Cache key ${cacheKey} dihapus.`);

      return result.rows[0];
    } catch (err) {
      console.log(err.message);
    }
  }

  // tampilkan pesan
  static async messageShowByIdModel(id_engineer) {
    const cacheKey = `chat_message:${id_engineer}`;
    
    try {
      const cachedResult = await redisClient.get(cacheKey);

      if (cachedResult) {
        console.log(`[CACHE HIT] Data chat untuk ${id_engineer} diambil dari Redis.`);
        return JSON.parse(cachedResult);
      }

      console.log(`[CACHE MISS] Data chat untuk ${id_engineer} diambil dari Database.`);
      const textQuery =
        "SELECT message, response FROM chat_message WHERE id_engineer = $1;";
      
      const result = await query(textQuery, [id_engineer]);
      const messages = result.rows;

      await redisClient.setEx(cacheKey, CACHE_EXPIRATION, JSON.stringify(messages));

      return messages;
    } catch (err) {
      console.log(err.message);
    }
  }
}

module.exports = { ChatMessageModel };
