import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IContact } from '../models/usuario';

export class ContactService {
    constructor(private db: Pool) { }

    async createContact(name: string, channelId: string): Promise<IContact> {
        const id = uuidv4();
        const createdAt = new Date();
        const updatedAt = new Date();
        await this.db.execute(
            'INSERT INTO contacts (id, name, channel_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [id, name, channelId, createdAt, updatedAt]
        );
        return { id, name, channel_id: channelId, created_at: createdAt, updated_at: updatedAt };
    }

    async getContactById(id: string): Promise<IContact | null> {
        const [rows] = await this.db.execute('SELECT * FROM contacts WHERE id = ?', [id]);
        const contacts = rows as IContact[];
        return contacts.length > 0 ? contacts[0] : null;
    }

    async getAllContacts(): Promise<IContact[]> {
        const [rows] = await this.db.execute('SELECT * FROM contacts');
        return rows as IContact[];
    }

    async updateContact(id: string, name: string, channelId: string): Promise<IContact | null> {
        const updatedAt = new Date();
        await this.db.execute(
            'UPDATE contacts SET name = ?, channel_id = ?, updated_at = ? WHERE id = ?',
            [name, channelId, updatedAt, id]
        );
        return this.getContactById(id);
    }

    async deleteContact(id: string): Promise<void> {
        await this.db.execute('DELETE FROM contacts WHERE id = ?', [id]);
    }
}


