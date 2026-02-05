import * as fs from 'fs';
import * as path from 'path';
import { metricsService } from '../services/metrics.service';

export class FileUtils {
    public static async downloadFile(url: string, type: 'multimedia' | 'archivo'): Promise<{ path: string; filename: string; mimetype: string } | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            const contentType = response.headers.get('content-type') || 'application/octet-stream';

            // Extract filename from url or header
            const urlObj = new URL(url);
            const urlPath = urlObj.pathname;
            let filename = path.basename(urlPath);

            // Handle cases where filename is in query params (common in APIs)
            // e.g. /preview?fileName=foo.jpg
            const queryFileName = urlObj.searchParams.get('fileName') || urlObj.searchParams.get('filename');
            if (queryFileName) {
                filename = path.basename(queryFileName);
            }

            if (!filename || filename === '/' || filename === 'preview') {
                // If filename is generic or empty, try to use timestamp
                filename = `file_${Date.now()}`;
            }

            // Ensure extension matches content type if possible, if not already present
            if (!path.extname(filename)) {
                if (contentType.includes('image/jpeg')) filename += '.jpg';
                else if (contentType.includes('image/png')) filename += '.png';
                else if (contentType.includes('application/pdf')) filename += '.pdf';
                else if (contentType.includes('text/plain')) filename += '.txt';
            }

            const downloadPath = path.resolve(process.cwd(), 'downloads');
            if (!fs.existsSync(downloadPath)) {
                fs.mkdirSync(downloadPath, { recursive: true });
            }

            const filePath = path.join(downloadPath, `${Date.now()}_${filename}`);
            fs.writeFileSync(filePath, Buffer.from(buffer));

            return { path: filePath, filename, mimetype: contentType };
        } catch (error: any) {
            console.error(`[FileUtils] Error descargando archivo ${url}:`, error);
            await metricsService.trackDownloadFailed(url, error.message);
            return null;
        }
    }
}
