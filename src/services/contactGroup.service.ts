import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IContactGroup, IContactGroupMember } from '../models/usuario';

class ContactGroupService {
    constructor(private db: Pool) { }

    async createContactGroup(botId: string, name: string, description: string): Promise<IContactGroup> {
        const id = uuidv4();
        const createdAt = new Date();
        const updatedAt = new Date();
        await this.db.execute(
            'INSERT INTO contact_groups (id, bot_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [id, botId, name, description, createdAt, updatedAt]
        );
        return { id, bot_id: botId, name, description, created_at: createdAt, updated_at: updatedAt };
    }

    async getContactGroupById(id: string): Promise<IContactGroup | null> {
        const [rows] = await this.db.execute('SELECT * FROM contact_groups WHERE id = ?', [id]);
        const contactGroups = rows as IContactGroup[];
        return contactGroups.length > 0 ? contactGroups[0] : null;
    }

    async getAllContactGroups(): Promise<IContactGroup[]> {
        const [rows] = await this.db.execute('SELECT * FROM contact_groups');
        return rows as IContactGroup[];
    }

    async updateContactGroup(id: string, name: string, description: string): Promise<IContactGroup | null> {
        const updatedAt = new Date();
        await this.db.execute(
            'UPDATE contact_groups SET name = ?, description = ?, updated_at = ? WHERE id = ?',
            [name, description, updatedAt, id]
        );
        return this.getContactGroupById(id);
    }

    async deleteContactGroup(id: string): Promise<void> {
        await this.db.execute('DELETE FROM contact_groups WHERE id = ?', [id]);
    }

    async addContactToGroup(groupId: string, contactId: string): Promise<IContactGroupMember> {
        await this.db.execute(
            'INSERT INTO contact_group_members (group_id, contact_id) VALUES (?, ?)',
            [groupId, contactId]
        );
        return { group_id: groupId, contact_id: contactId };
    }

    async removeContactFromGroup(groupId: string, contactId: string): Promise<void> {
        await this.db.execute(
            'DELETE FROM contact_group_members WHERE group_id = ? AND contact_id = ?',
            [groupId, contactId]
        );
    }
}

export default ContactGroupService;
