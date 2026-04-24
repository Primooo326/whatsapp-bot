import { FileUtils } from '../utils/FileUtils';
import * as fs from 'fs';

async function testDownload() {
    console.log('--- Testing File Download ---');

    // Test Case 1: Valid URL (from user)
    const validUrl = 'https://api.oberon360.com/api/upload/preview?fileName=elecciones/funcionalidades/register/1770290018927.jpg';
    console.log(`\n1. Testing Valid URL: ${validUrl}`);
    const file1 = await FileUtils.downloadFile(validUrl, 'multimedia');

    if (file1) {
        console.log('✅ Success!');
        console.log(`   Path: ${file1.path}`);
        console.log(`   Filename: ${file1.filename}`);
        console.log(`   Mimetype: ${file1.mimetype}`);

        // Clean up
        if (fs.existsSync(file1.path)) {
            fs.unlinkSync(file1.path);
            console.log('   (File deleted after test)');
        }
    } else {
        console.error('❌ Failed to download valid file.');
    }

    // Test Case 2: Invalid URL
    const invalidUrl = 'https://api.oberon360.com/api/upload/preview?fileName=elecciones/funcionalidades/register/INVALID_FILE_12345.jpg';
    console.log(`\n2. Testing Invalid URL: ${invalidUrl}`);
    const file2 = await FileUtils.downloadFile(invalidUrl, 'multimedia');

    if (file2) {
        console.error('❌ Unexpected success for invalid file!');
        // Clean up
        if (fs.existsSync(file2.path)) fs.unlinkSync(file2.path);
    } else {
        console.log('✅ Success! Download failed as expected.');
    }
}

testDownload().catch(console.error);
