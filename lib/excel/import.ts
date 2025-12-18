/**
 * Excel Import Functions
 * Sesuai PRD - Excel Parser (Migrated to ExcelJS)
 * 
 * Import data from Excel format (.xlsx)
 */

import ExcelJS from 'exceljs';

/**
 * Parse Excel file to JSON
 */
export function parseExcelFile<T = unknown>(
  file: File | ArrayBuffer
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    try {
      if (file instanceof File) {
        // Read File using FileReader
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result;
            if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
              reject(new Error('Failed to read file'));
              return;
            }

            const data = await parseArrayBuffer<T>(arrayBuffer);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        // ArrayBuffer
        parseArrayBuffer<T>(file)
          .then(resolve)
          .catch(reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse ArrayBuffer to JSON using ExcelJS
 */
async function parseArrayBuffer<T = unknown>(buffer: ArrayBuffer): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Workbook has no sheets');
  }
  
  // Get headers from first row
  const headers: string[] = [];
  const firstRow = worksheet.getRow(1);
  firstRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || '');
  });
  
  if (headers.length === 0) {
    throw new Error('Worksheet has no headers');
  }
  
  // Convert rows to JSON
  const jsonData: T[] = [];
  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;
    
    const rowData: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.value;
      }
    });
    
    // Only add row if it has data
    if (Object.keys(rowData).length > 0) {
      jsonData.push(rowData as T);
    }
  });
  
  return jsonData;
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
