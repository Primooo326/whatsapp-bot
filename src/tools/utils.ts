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

export const generarPDFConImagen = async (fechaExp: string, fechaExcusa: string, horaCulminada: string) => {
    const pdfGenerator = new PDFGenerator();

    const textos: TextConfig[] = [
        {
            text: formatearFecha(fechaExp),
            isBold: true,
            fontSize: 10,
            x: 50,
            y: 200
        },
        {
            text: "La compañía",
            isBold: false,
            fontSize: 10,
            x: 50,
            y: 250
        },
        {
            text: "THOMAS SEGURIDAD INTEGRAL LTDA",
            isBold: true,
            fontSize: 10,
            x: 130,
            y: 250
        },
        {
            text: "con",
            isBold: false,
            fontSize: 10,
            x: 385,
            y: 250
        },
        {
            text: "NIT 830014193-5",
            isBold: true,
            fontSize: 10,
            x: 410,
            y: 250
        },
        {
            text: "A quien corresponda,",
            isBold: false,
            fontSize: 10,
            x: 50,
            y: 300
        },
        {
            text: `Por medio de la presente se certifica que el señor Juan Andrés Morales Lizarazo, identificado con cédula de ciudadanía número 1001092278, se encontraba laborando en nuestras instalaciones el día ${formatearFecha(fechaExcusa)} y su jornada laboral culminó a las ${horaCulminada}`,
            isBold: false,
            fontSize: 10,
            x: 50,
            y: 350
        },
        {
            text: "Este documento se expide a solicitud del interesado para los fines que estime convenientes.",
            isBold: false,
            fontSize: 10,
            x: 50,
            y: 450
        },
        {
            text: "Atentamente,",
            isBold: false,
            fontSize: 10,
            x: 50,
            y: 500
        },
        {
            text: "Johnatan Bonilla González",
            isBold: true,
            fontSize: 10,
            x: 50,
            y: 550
        },
        {
            text: "Líder de desarrollo",
            isBold: true,
            fontSize: 10,
            x: 50,
            y: 570
        },
        {
            text: "Thomas Seguridad Integral",
            isBold: true,
            fontSize: 10,
            x: 50,
            y: 590
        },
        {
            text: "(318) 311 7396",
            isBold: true,
            fontSize: 10,
            x: 50,
            y: 610
        },
        {
            text: "Johnatan.bonilla@tsicol.com",
            isBold: true,
            fontSize: 10,
            x: 50,
            y: 630
        },

    ];

    try {
        const relativePath = await pdfGenerator.generatePDF(
            'assets/image.png',
            textos,
            'JuanMoralesExcusa.pdf'
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