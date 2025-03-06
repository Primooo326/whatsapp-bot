import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IService, ServiceCategory, ServiceScheduledType, ServiceStatus } from '../models/usuario';

class ServiceService {
    constructor(private db: Pool) { }

    async createService(botId: string, name: string, category: ServiceCategory, description: string, scheduledDate: ServiceScheduledType, scheduledType: ServiceScheduledType, status: ServiceStatus): Promise<IService> {
        const id = uuidv4();
        const createdAt = new Date();
        const updatedAt = new Date();
        await this.db.execute(
            'INSERT INTO services (id, bot_id, name, category, description, scheduled_date, scheduled_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, botId, name, category, description, scheduledDate, scheduledType, status, createdAt, updatedAt]
        );
        return { id, bot_id: botId, name, category, description, scheduled_date: scheduledDate, scheduled_type: scheduledType, status, created_at: createdAt, updated_at: updatedAt };
    }

    async getServiceById(id: string): Promise<IService | null> {
        const [rows] = await this.db.execute('SELECT * FROM services WHERE id = ?', [id]);
        const services = rows as IService[];
        return services.length > 0 ? services[0] : null;
    }

    async getAllServices(): Promise<IService[]> {
        const [rows] = await this.db.execute('SELECT * FROM services');
        return rows as IService[];
    }

    async updateService(id: string, name: string, category: string, description: string, scheduledDate: string, scheduledType: string, status: string): Promise<IService | null> {
        const updatedAt = new Date();
        await this.db.execute(
            'UPDATE services SET name = ?, category = ?, description = ?, scheduled_date = ?, scheduled_type = ?, status = ?, updated_at = ? WHERE id = ?',
            [name, category, description, scheduledDate, scheduledType, status, updatedAt, id]
        );
        return this.getServiceById(id);
    }

    async deleteService(id: string): Promise<void> {
        await this.db.execute('DELETE FROM services WHERE id = ?', [id]);
    }
}

export default ServiceService;