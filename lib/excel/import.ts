/**
 * Excel Import Functions
 * Sesuai PRD - Excel Parser (SheetJS)
 * 
 * Import data from Excel format (.xlsx)
 */

import * as XLSX from 'xlsx';

/**
 * Parse Excel file to JSON
 */
export function parseExcelFile<T = unknown>(
  file: File | ArrayBuffer
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error('Workbook has no sheets');
          }
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            throw new Error('Worksheet not found');
          }
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file instanceof File) {
        reader.readAsBinaryString(file);
      } else {
        // ArrayBuffer
        const binaryString = new Uint8Array(file)
          .reduce((data, byte) => data + String.fromCharCode(byte), '');
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Workbook has no sheets'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          reject(new Error('Worksheet not found'));
          return;
        }
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Import master data from Excel
 */
export async function importMasterData(
  file: File
): Promise<{
  packages?: Array<{
    name: string;
    destination: string;
    description?: string;
    pricePublish: number;
    priceNTA: number;
  }>;
  cities?: Array<{
    name: string;
    province: string;
    code?: string;
  }>;
}> {
  const data = await parseExcelFile<Record<string, unknown>>(file);
  
  // Detect sheet type based on columns
  const firstRow = data[0];
  if (!firstRow) {
    throw new Error('Excel file is empty');
  }

  const columns = Object.keys(firstRow);
  
  // Package data
  if (columns.includes('name') && columns.includes('destination')) {
    return {
      packages: data.map((row) => ({
        name: String(row.name || ''),
        destination: String(row.destination || ''),
        description: String(row.description || ''),
        pricePublish: Number(row.pricePublish || 0),
        priceNTA: Number(row.priceNTA || 0),
      })),
    };
  }
  
  // City data
  if (columns.includes('name') && columns.includes('province')) {
    return {
      cities: data.map((row) => ({
        name: String(row.name || ''),
        province: String(row.province || ''),
        code: String(row.code || ''),
      })),
    };
  }
  
  throw new Error('Unknown Excel format. Expected packages or cities data.');
}

/**
 * Validate Excel data structure
 */
export function validateExcelData(
  data: unknown[],
  requiredColumns: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('Excel file is empty');
    return { valid: false, errors };
  }
  
  const firstRow = data[0];
  if (typeof firstRow !== 'object' || firstRow === null) {
    errors.push('Invalid data format');
    return { valid: false, errors };
  }
  
  const columns = Object.keys(firstRow);
  const missingColumns = requiredColumns.filter((col) => !columns.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

