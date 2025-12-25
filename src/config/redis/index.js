'use strict';

const redis = require('redis');
const redisConfig = require('./redis.config');
const redisClient = redis.createClient(redisConfig);

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Redis client connected');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
    }
}

redisClient.on('connect', () => {
    console.log('Redis client connected');
});

connectRedis();

module.exports = { redisClient };