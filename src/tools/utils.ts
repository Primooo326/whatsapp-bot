import { PDFGenerator, TextConfig } from "./pdf";
import * as fs from 'fs';
import * as path from 'path';
export function formatearFecha(fechaStr: string): string {
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    // Validar el formato de entrada
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
        throw new Error('Formato de fecha inválido. Use DD/MM/YYYY');
    }

    const [dia, mes, año] = fechaStr.split('/');
    const mesIndex = parseInt(mes) - 1;

    // Validar valores
    if (mesIndex < 0 || mesIndex > 11) {
        throw new Error('Mes inválido');
    }

    return `${parseInt(dia)} de ${meses[mesIndex]} de ${año}`;
}
interface IGenerarPDFConImagen {
    fileOutPath: string
    imgPath: string,
    textos: TextConfig[]
}

export const generarPDFConImagen = async (
    config: IGenerarPDFConImagen) => {
    const pdfGenerator = new PDFGenerator();

    const { textos, imgPath, fileOutPath } = config

    try {

        const relativePath = await pdfGenerator.generatePDF(
            imgPath,
            textos,
            fileOutPath
        );
        console.log('PDF generado exitosamente');
        console.log('Ruta relativa del archivo:', relativePath);
        return relativePath;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};



export function validarHora(hora: string): boolean {
    const regexHora1 = /^(1[0-2]|0?[1-9]):([0-5][0-9])(AM|PM)$/i;
    return regexHora1.test(hora);
}

/**
 * Descarga un archivo multimedia desde un objeto MessageMedia y lo guarda en la carpeta de descargas
 * @param media Objeto MessageMedia con los datos del archivo
 * @returns Promise con la ruta del archivo guardado
 */
export function downloadMedia(media: {
    mimetype: string;
    data: string;
    filename?: string;
    filesize?: number;
}): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Crear directorio de descargas si no existe
            const downloadDir = path.join(process.cwd(), 'downloads');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }

            // Usar el nombre de archivo proporcionado o generar uno basado en la fecha
            const filename = media.filename ||
                `file_${new Date().toISOString().replace(/[:.]/g, '-')}.${getExtensionFromMimeType(media.mimetype)}`;

            // Ruta completa del archivo
            const filePath = path.join(downloadDir, filename);

            // Convertir la data en base64 a un buffer
            const fileData = Buffer.from(media.data, 'base64');

            // Escribir el archivo
            fs.writeFile(filePath, fileData, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log(`Archivo guardado en: ${filePath}`);
                resolve(filePath);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Obtiene la extensión de archivo basada en el tipo MIME
 * @param mimeType Tipo MIME del archivo
 * @returns Extensión del archivo
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };

    return mimeToExt[mimeType] || 'bin';
}