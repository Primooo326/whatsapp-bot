import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '../models/usuario';
import bcrypt from 'bcrypt';

class UserService {
    constructor(private db: Pool) { }

    async createUser(username: string, email: string, password: string): Promise<IUser> {
        const id = uuidv4();
        const createdAt = new Date();
        const updatedAt = new Date();
        const passwordHash = await bcrypt.hash(password, 10);
        await this.db.execute(
            'INSERT INTO users (id, username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, passwordHash, createdAt, updatedAt]
        );
        return { id, username, email, password_hash: passwordHash, created_at: createdAt, updated_at: updatedAt };
    }

    async getUserById(id: string): Promise<IUser | null> {
        const [rows] = await this.db.execute('SELECT * FROM users WHERE id = ?', [id]);
        const users = rows as IUser[];
        return users.length > 0 ? users[0] : null;
    }

    async getUserByEmail(email: string): Promise<IUser | null> {
        const [rows] = await this.db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const users = rows as IUser[];
        return users.length > 0 ? users[0] : null;
    }

    async getAllUsers(): Promise<IUser[]> {
        const [rows] = await this.db.execute('SELECT * FROM users');
        return rows as IUser[];
    }

    async updateUser(id: string, username: string, email: string, password: string): Promise<IUser | null> {
        const updatedAt = new Date();
        const passwordHash = await bcrypt.hash(password, 10);
        await this.db.execute(
            'UPDATE users SET username = ?, email = ?, password_hash = ?, updated_at = ? WHERE id = ?',
            [username, email, passwordHash, updatedAt, id]
        );
        return this.getUserById(id);
    }

    async deleteUser(id: string): Promise<void> {
        await this.db.execute('DELETE FROM users WHERE id = ?', [id]);
    }

    async changePassword(id: string, password: string): Promise<IUser | null> {
        const updatedAt = new Date();
        const passwordHash = await bcrypt.hash(password, 10);
        await this.db.execute(
            'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
            [passwordHash, updatedAt, id]
        );
        return this.getUserById(id);
    }
}

export default UserService;