import { createClient } from "redis";

const memoryCache = new Map();
let redisClient = null;
let redisReady = false;

const normalizeValue = (value) => {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const serializeValue = (value) => JSON.stringify(value);

const initRedis = () => {
  const url = process.env.REDIS_URL;
  if (!url) return;

  redisClient = createClient({ url });
  redisClient.on("error", (err) => {
    console.error("Redis error:", err?.message || err);
  });
  redisClient
    .connect()
    .then(() => {
      redisReady = true;
      console.log("Redis connected");
    })
    .catch((err) => {
      console.error("Redis connection failed:", err?.message || err);
      redisReady = false;
    });
};

initRedis();

export const getCache = async (key) => {
  if (redisClient && redisReady) {
    const value = await redisClient.get(key);
    if (!value) return null;
    return normalizeValue(value);
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const setCache = async (key, value, ttlMs = 15000) => {
  if (redisClient && redisReady) {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await redisClient.setEx(key, ttlSeconds, serializeValue(value));
    return;
  }

  const expiresAt = ttlMs ? Date.now() + ttlMs : null;
  memoryCache.set(key, { value, expiresAt });
};

export const deleteCache = async (key) => {
  if (redisClient && redisReady) {
    await redisClient.del(key);
    return;
  }
  memoryCache.delete(key);
};

export const deleteByPrefix = async (prefix) => {
  if (redisClient && redisReady) {
    const pattern = `${prefix}*`;
    let cursor = 0;
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 50 });
      cursor = Number(reply.cursor);
      const keys = reply.keys;
      if (keys.length) {
        await redisClient.del(keys);
      }
    } while (cursor !== 0);
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};
