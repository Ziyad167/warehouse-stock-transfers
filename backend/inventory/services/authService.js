const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const SESSIONS_FILE = path.join(__dirname, '..', 'data', 'sessions.json');
const KEY_LENGTH = 64;

async function readUsers() {
  const text = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(text);
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2) + '\n');
}

async function readSessions() {
  const text = await fs.readFile(SESSIONS_FILE, 'utf8');
  return JSON.parse(text);
}

async function writeSessions(sessions) {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2) + '\n');
}

// Turns a password into a hash with a random salt (Lab 8: crypto.scrypt)
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) return reject(error);
      resolve({ salt, hash: key.toString('hex') });
    });
  });
}

// Hashes the typed password with the saved salt and compares it to the saved hash
function verifyPassword(password, salt, savedHash) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) return reject(error);
      const saved = Buffer.from(savedHash, 'hex');
      if (saved.length !== key.length) return resolve(false);
      resolve(crypto.timingSafeEqual(key, saved));
    });
  });
}

async function findUserByUsername(username) {
  const users = await readUsers();
  return users.find((user) => user.username === username);
}

// Saves a new user; the password itself is never stored, only its hash
async function createUser({ username, password, role }) {
  const users = await readUsers();
  const { salt, hash } = await hashPassword(password);
  users.push({
    username,
    role,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  });
  await writeUsers(users);
}

// Checks the username and password; returns { username, role } or null
async function checkLogin(username, password) {
  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }
  const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) {
    return null;
  }
  return { username: user.username, role: user.role };
}

// Creates a session with a random token and returns the token
async function createSession(username) {
  const sessions = await readSessions();
  const token = crypto.randomBytes(32).toString('hex');
  sessions.push({ token, username, createdAt: new Date().toISOString() });
  await writeSessions(sessions);
  return token;
}

// Finds who owns a token; returns { username, role } or null
async function findUserByToken(token) {
  const sessions = await readSessions();
  const session = sessions.find((one) => one.token === token);
  if (!session) {
    return null;
  }
  const user = await findUserByUsername(session.username);
  if (!user) {
    return null;
  }
  return { username: user.username, role: user.role };
}

// Removes a session (logout)
async function deleteSession(token) {
  const sessions = await readSessions();
  const remaining = sessions.filter((one) => one.token !== token);
  await writeSessions(remaining);
}

module.exports = {
  findUserByUsername,
  createUser,
  checkLogin,
  createSession,
  findUserByToken,
  deleteSession
};