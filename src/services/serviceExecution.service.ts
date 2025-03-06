import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IServiceExecution, ServiceExecutionStatus } from '../models/usuario';

class ServiceExecutionService {
    constructor(private db: Pool) { }

    async createServiceExecution(serviceId: string, contactId: string, status: ServiceExecutionStatus): Promise<IServiceExecution> {
        const id = uuidv4();
        const executedAt = new Date();
        const createdAt = new Date();
        const updatedAt = new Date();
        await this.db.execute(
            'INSERT INTO service_executions (id, service_id, contact_id, executed_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, serviceId, contactId, executedAt, status, createdAt, updatedAt]
        );
        return { id, service_id: serviceId, contact_id: contactId, executed_at: executedAt, status, created_at: createdAt, updated_at: updatedAt };
    }

    async getServiceExecutionById(id: string): Promise<IServiceExecution | null> {
        const [rows] = await this.db.execute('SELECT * FROM service_executions WHERE id = ?', [id]);
        const serviceExecutions = rows as IServiceExecution[];
        return serviceExecutions.length > 0 ? serviceExecutions[0] : null;
    }

    async getAllServiceExecutions(): Promise<IServiceExecution[]> {
        const [rows] = await this.db.execute('SELECT * FROM service_executions');
        return rows as IServiceExecution[];
    }

    async updateServiceExecution(id: string, status: ServiceExecutionStatus): Promise<IServiceExecution | null> {
        const updatedAt = new Date();
        await this.db.execute(
            'UPDATE service_executions SET status = ?, updated_at = ? WHERE id = ?',
            [status, updatedAt, id]
        );
        return this.getServiceExecutionById(id);
    }

    async deleteServiceExecution(id: string): Promise<void> {
        await this.db.execute('DELETE FROM service_executions WHERE id = ?', [id]);
    }
}

export default ServiceExecutionService;