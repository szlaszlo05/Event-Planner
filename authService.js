import sql from 'mssql';
import bcrypt from 'bcrypt';
import { getPool } from './dbConnect.js';

export async function registerUser(username, password) {
  try {
    const pool = await getPool();
    const checkRequest = pool.request();
    checkRequest.input('Username', sql.NVarChar, username);
    const checkResult = await checkRequest.query('SELECT * FROM Users WHERE Username = @Username');

    if (checkResult.recordset.length > 0) {
      return { success: false, message: 'Username already exists.' };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertRequest = pool.request();
    insertRequest.input('Username', sql.NVarChar, username);
    insertRequest.input('PasswordHash', sql.NVarChar, passwordHash);

    await insertRequest.query('INSERT INTO Users (Username, PasswordHash) VALUES (@Username, @PasswordHash)');

    return { success: true, message: 'Registration successful! Please login.' };
  } catch (error) {
    console.error('Registration Error:', error);
    return { success: false, message: 'Database error during registration.' };
  }
}

export async function loginUser(username, password) {
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('Username', sql.NVarChar, username);
    const result = await request.query('SELECT * FROM Users WHERE Username = @Username');

    const user = result.recordset[0];
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const match = await bcrypt.compare(password, user.PasswordHash);

    if (match) {
      return {
        success: true,
        user: { id: user.Id, username: user.Username },
      };
    }
    return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: 'Server error during login.' };
  }
}
