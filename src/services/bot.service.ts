import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { BotStatus, IBot } from '../models/usuario';

class BotService {
    constructor(private db: Pool) { }

    async createBot(userId: string, name: string, description: string, status: BotStatus): Promise<IBot> {
        const id = uuidv4();
        const createdAt = new Date();
        const updatedAt = new Date();
        await this.db.execute(
            'INSERT INTO bots (id, user_id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, userId, name, description, status, createdAt, updatedAt]
        );
        return { id, user_id: userId, name, description, status, created_at: createdAt, updated_at: updatedAt };
    }

    async getBotById(id: string): Promise<IBot | null> {
        const [rows] = await this.db.execute('SELECT * FROM bots WHERE id = ?', [id]);
        const bots = rows as IBot[];
        return bots.length > 0 ? bots[0] : null;
    }

    async getAllBots(): Promise<IBot[]> {
        const [rows] = await this.db.execute('SELECT * FROM bots');
        return rows as IBot[];
    }

    async updateBot(id: string, name: string, description: string, status: string): Promise<IBot | null> {
        const updatedAt = new Date();
        await this.db.execute(
            'UPDATE bots SET name = ?, description = ?, status = ?, updated_at = ? WHERE id = ?',
            [name, description, status, updatedAt, id]
        );
        return this.getBotById(id);
    }

    async deleteBot(id: string): Promise<void> {
        await this.db.execute('DELETE FROM bots WHERE id = ?', [id]);
        await this.db.execute('DELETE FROM services WHERE bot_id = ?', [id]);
        await this.db.execute('DELETE FROM contact_groups WHERE bot_id = ?', [id]);
    }
}

export default BotService;