/**
 * Insurance Manifest File Generation
 * Generate CSV or PDF files for insurance manifests
 */

import 'server-only';

import ExcelJS from 'exceljs';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';

import { ManifestPDF, type ManifestData } from '@/lib/pdf/manifest';

export type ManifestPassenger = {
  name: string;
  nik?: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  email?: string;
};

/**
 * Generate CSV file from manifest data
 */
export async function generateManifestCSV(
  passengers: ManifestPassenger[],
  tripDate: string
): Promise<Buffer> {
  if (passengers.length === 0) {
    throw new Error('No passengers to generate manifest');
  }

  // CSV Headers
  const headers = ['No', 'Nama', 'NIK', 'Tanggal Lahir', 'Jenis Kelamin', 'Telepon', 'Email'];
  const rows: string[] = [headers.join(',')];

  // CSV Rows
  passengers.forEach((passenger, index) => {
    const row = [
      String(index + 1),
      `"${passenger.name || ''}"`,
      `"${passenger.nik || ''}"`,
      `"${passenger.birth_date || ''}"`,
      `"${passenger.gender || ''}"`,
      `"${passenger.phone || ''}"`,
      `"${passenger.email || ''}"`,
    ];
    rows.push(row.join(','));
  });

  const csvContent = rows.join('\n');
  return Buffer.from(csvContent, 'utf-8');
}

/**
 * Generate Excel file from manifest data
 */
export async function generateManifestExcel(
  passengers: ManifestPassenger[],
  tripDate: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Manifest');

  // Headers
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama', key: 'name', width: 30 },
    { header: 'NIK', key: 'nik', width: 20 },
    { header: 'Tanggal Lahir', key: 'birth_date', width: 15 },
    { header: 'Jenis Kelamin', key: 'gender', width: 15 },
    { header: 'Telepon', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
  ];

  // Add rows
  passengers.forEach((passenger, index) => {
    worksheet.addRow({
      no: index + 1,
      name: passenger.name || '',
      nik: passenger.nik || '',
      birth_date: passenger.birth_date || '',
      gender: passenger.gender || '',
      phone: passenger.phone || '',
      email: passenger.email || '',
    });
  });

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Generate PDF file from manifest data
 */
export async function generateManifestPDF(
  passengers: ManifestPassenger[],
  tripDate: string,
  tripInfo?: {
    tripCode?: string;
    tripName?: string;
    destination?: string;
  }
): Promise<Buffer> {
  const manifestData: ManifestData = {
    manifestNumber: tripInfo?.tripCode || `MAN-${tripDate.replace(/-/g, '')}`,
    tripName: tripInfo?.tripName || 'Trip Manifest',
    destination: tripInfo?.destination || 'N/A',
    departureDate: tripDate,
    participants: passengers.map((p, index) => ({
      no: index + 1,
      name: p.name || '',
      idNumber: p.nik || '',
      phone: p.phone || '',
      emergencyContact: p.email || '',
      notes: undefined,
    })),
    totalPax: passengers.length,
  };

  const pdfDoc = <ManifestPDF data={manifestData} />;
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

/**
 * Generate manifest file based on format type
 */
export async function generateManifestFile(
  passengers: ManifestPassenger[],
  tripDate: string,
  format: 'csv' | 'excel' | 'pdf',
  tripInfo?: {
    tripCode?: string;
    tripName?: string;
    destination?: string;
  }
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const dateStr = tripDate.replace(/-/g, '');
  let buffer: Buffer;
  let filename: string;
  let contentType: string;

  switch (format) {
    case 'csv':
      buffer = await generateManifestCSV(passengers, tripDate);
      filename = `manifest-${dateStr}.csv`;
      contentType = 'text/csv';
      break;
    case 'excel':
      buffer = await generateManifestExcel(passengers, tripDate);
      filename = `manifest-${dateStr}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    case 'pdf':
      buffer = await generateManifestPDF(passengers, tripDate, tripInfo);
      filename = `manifest-${dateStr}.pdf`;
      contentType = 'application/pdf';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  return { buffer, filename, contentType };
}

