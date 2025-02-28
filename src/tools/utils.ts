import { PDFGenerator, TextConfig } from "./pdf";

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