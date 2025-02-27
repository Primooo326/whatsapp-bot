import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface TextConfig {
    text: string;
    isBold: boolean;
    fontSize: number;
    x: number;
    y: number;
}

export class PDFGenerator {
    private doc: PDFKit.PDFDocument;
    private downloadPath: string;
    width = 595 * 0.75;
    height = 842 * 0.75;
    constructor() {

        this.doc = new PDFDocument({
            size: [this.width, this.height],
            margin: 50
        });

        // Crear directorio downloads si no existe
        this.downloadPath = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }
    }

    async generatePDF(
        imagePath: string,
        textConfigs: TextConfig[],
        fileName: string = 'documento.pdf'
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                // Crear la ruta completa del archivo
                const fullPath = path.join(this.downloadPath, fileName);

                // Crear write stream
                const writeStream = fs.createWriteStream(fullPath);

                // Manejar eventos del stream
                writeStream.on('finish', () => {
                    // Devolver ruta relativa
                    const relativePath = path.relative(process.cwd(), fullPath);
                    resolve(relativePath);
                });

                writeStream.on('error', (error) => {
                    reject(error);
                });

                // Pipe el documento al write stream
                this.doc.pipe(writeStream);

                // Agregar la imagen al PDF
                this.doc.image(imagePath, 0, 0, {
                    width: this.width,
                    height: this.height
                });

                // Agregar textos dinámicos
                textConfigs.forEach(config => {
                    if (config.isBold) {
                        this.doc
                            .font('Helvetica-Bold')
                            .fontSize(config.fontSize)
                            .text(config.text, config.x * 0.75, config.y * 0.75);
                    } else {
                        this.doc
                            .font('Helvetica')
                            .fontSize(config.fontSize)
                            .text(config.text, config.x * 0.75, config.y * 0.75);
                    }
                });

                // Finalizar el documento
                this.doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}
