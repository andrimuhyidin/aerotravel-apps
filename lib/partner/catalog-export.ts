/**
 * Catalog Export Utility
 * Export package catalog to PDF or Excel
 */

import ExcelJS from 'exceljs';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export type PackageExportData = {
  id: string;
  name: string;
  destination: string;
  province: string;
  durationDays: number;
  durationNights: number;
  minPax: number;
  maxPax: number;
  packageType: string;
  thumbnailUrl: string | null;
  baseNTAPrice: number | null;
  basePublishPrice: number | null;
  margin: number;
  priceRange: {
    nta: { min: number; max: number };
    publish: { min: number; max: number };
  };
  pricingTiers: Array<{
    minPax: number;
    maxPax: number;
    ntaPrice: number;
    publishPrice: number;
    margin: number;
  }>;
  popularity?: {
    booking_count: number;
    total_revenue: number;
    popularity_score: number;
  };
  ratings?: {
    averageRating: number;
    totalReviews: number;
  };
  availability?: {
    status: 'available' | 'limited' | 'sold_out';
    nextAvailableDate: string | null;
    availableDatesCount: number;
  };
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  packageCard: {
    marginBottom: 20,
    padding: 15,
    border: '1 solid #ddd',
    borderRadius: 5,
  },
  packageName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  packageInfo: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  pricingTable: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '1 solid #ddd',
  },
  tableCol: {
    flex: 1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1 solid #ddd',
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
});

function CatalogPDF({ packages, exportDate }: { packages: PackageExportData[]; exportDate: string }) {
  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },
      React.createElement(
        View,
        { style: pdfStyles.header },
        React.createElement(Text, { style: pdfStyles.title }, 'Package Catalog'),
        React.createElement(Text, { style: pdfStyles.subtitle }, `Exported on: ${exportDate}`),
        React.createElement(Text, { style: pdfStyles.subtitle }, `Total Packages: ${packages.length}`)
      ),
      ...packages.map((pkg) =>
        React.createElement(
          View,
          { key: pkg.id, style: pdfStyles.packageCard, wrap: false },
          React.createElement(Text, { style: pdfStyles.packageName }, pkg.name),
          React.createElement(
            View,
            { style: pdfStyles.packageInfo },
            React.createElement(Text, { style: pdfStyles.label }, 'Destination:'),
            React.createElement(Text, { style: pdfStyles.value }, `${pkg.destination}, ${pkg.province}`)
          ),
          React.createElement(
            View,
            { style: pdfStyles.packageInfo },
            React.createElement(Text, { style: pdfStyles.label }, 'Duration:'),
            React.createElement(Text, { style: pdfStyles.value }, `${pkg.durationDays}H ${pkg.durationNights}M`)
          ),
          React.createElement(
            View,
            { style: pdfStyles.packageInfo },
            React.createElement(Text, { style: pdfStyles.label }, 'Pax Range:'),
            React.createElement(Text, { style: pdfStyles.value }, `${pkg.minPax}-${pkg.maxPax}`)
          ),
          React.createElement(
            View,
            { style: pdfStyles.packageInfo },
            React.createElement(Text, { style: pdfStyles.label }, 'Type:'),
            React.createElement(Text, { style: pdfStyles.value }, pkg.packageType)
          ),
          React.createElement(
            View,
            { style: pdfStyles.packageInfo },
            React.createElement(Text, { style: pdfStyles.label }, 'NTA Price:'),
            React.createElement(
              Text,
              { style: pdfStyles.value },
              pkg.priceRange.nta.min === pkg.priceRange.nta.max
                ? `Rp ${pkg.priceRange.nta.min.toLocaleString('id-ID')}`
                : `Rp ${pkg.priceRange.nta.min.toLocaleString('id-ID')} - Rp ${pkg.priceRange.nta.max.toLocaleString('id-ID')}`
            )
          ),
          React.createElement(
            View,
            { style: pdfStyles.packageInfo },
            React.createElement(Text, { style: pdfStyles.label }, 'Margin:'),
            React.createElement(Text, { style: pdfStyles.value }, `Rp ${pkg.margin.toLocaleString('id-ID')}/pax`)
          ),
          pkg.ratings && pkg.ratings.totalReviews > 0
            ? React.createElement(
                View,
                { style: pdfStyles.packageInfo },
                React.createElement(Text, { style: pdfStyles.label }, 'Rating:'),
                React.createElement(
                  Text,
                  { style: pdfStyles.value },
                  `${pkg.ratings.averageRating.toFixed(1)} (${pkg.ratings.totalReviews} reviews)`
                )
              )
            : null,
          pkg.availability
            ? React.createElement(
                View,
                { style: pdfStyles.packageInfo },
                React.createElement(Text, { style: pdfStyles.label }, 'Availability:'),
                React.createElement(
                  Text,
                  { style: pdfStyles.value },
                  `${pkg.availability.status} (${pkg.availability.availableDatesCount} dates)`
                )
              )
            : null,
          pkg.pricingTiers.length > 0
            ? React.createElement(
                View,
                { style: pdfStyles.pricingTable },
                React.createElement(
                  View,
                  { style: pdfStyles.tableHeader },
                  React.createElement(Text, { style: pdfStyles.tableCol }, 'Pax Range'),
                  React.createElement(Text, { style: pdfStyles.tableCol }, 'NTA Price'),
                  React.createElement(Text, { style: pdfStyles.tableCol }, 'Publish Price'),
                  React.createElement(Text, { style: pdfStyles.tableCol }, 'Margin')
                ),
                ...pkg.pricingTiers.map((tier, idx) =>
                  React.createElement(
                    View,
                    { key: idx, style: pdfStyles.tableRow },
                    React.createElement(Text, { style: pdfStyles.tableCol }, `${tier.minPax}-${tier.maxPax}`),
                    React.createElement(Text, { style: pdfStyles.tableCol }, `Rp ${tier.ntaPrice.toLocaleString('id-ID')}`),
                    React.createElement(Text, { style: pdfStyles.tableCol }, `Rp ${tier.publishPrice.toLocaleString('id-ID')}`),
                    React.createElement(Text, { style: pdfStyles.tableCol }, `Rp ${tier.margin.toLocaleString('id-ID')}`)
                  )
                )
              )
            : null
        )
      ),
      React.createElement(
        View,
        { style: pdfStyles.footer },
        React.createElement(Text, {}, 'Generated by AeroTravel Partner Portal')
      )
    )
  );
}

/**
 * Generate PDF catalog
 */
export async function generateCatalogPDF(packages: PackageExportData[]): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const exportDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pdfDoc = React.createElement(CatalogPDF, { packages, exportDate });
  const buffer = await renderToBuffer(pdfDoc as any);
  return Buffer.from(buffer);
}

/**
 * Generate Excel catalog
 */
export async function generateCatalogExcel(packages: PackageExportData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Package Catalog');

  // Set column headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Destination', key: 'destination', width: 25 },
    { header: 'Province', key: 'province', width: 20 },
    { header: 'Duration (Days)', key: 'durationDays', width: 15 },
    { header: 'Duration (Nights)', key: 'durationNights', width: 15 },
    { header: 'Min Pax', key: 'minPax', width: 10 },
    { header: 'Max Pax', key: 'maxPax', width: 10 },
    { header: 'Package Type', key: 'packageType', width: 15 },
    { header: 'NTA Price Min', key: 'ntaPriceMin', width: 15 },
    { header: 'NTA Price Max', key: 'ntaPriceMax', width: 15 },
    { header: 'Publish Price Min', key: 'publishPriceMin', width: 15 },
    { header: 'Publish Price Max', key: 'publishPriceMax', width: 15 },
    { header: 'Margin', key: 'margin', width: 15 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Total Reviews', key: 'totalReviews', width: 12 },
    { header: 'Availability Status', key: 'availabilityStatus', width: 18 },
    { header: 'Available Dates', key: 'availableDates', width: 15 },
    { header: 'Popularity Score', key: 'popularityScore', width: 15 },
    { header: 'Booking Count', key: 'bookingCount', width: 15 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  packages.forEach((pkg) => {
    worksheet.addRow({
      id: pkg.id,
      name: pkg.name,
      destination: pkg.destination,
      province: pkg.province,
      durationDays: pkg.durationDays,
      durationNights: pkg.durationNights,
      minPax: pkg.minPax,
      maxPax: pkg.maxPax,
      packageType: pkg.packageType,
      ntaPriceMin: pkg.priceRange.nta.min,
      ntaPriceMax: pkg.priceRange.nta.max,
      publishPriceMin: pkg.priceRange.publish.min,
      publishPriceMax: pkg.priceRange.publish.max,
      margin: pkg.margin,
      rating: pkg.ratings?.averageRating || 0,
      totalReviews: pkg.ratings?.totalReviews || 0,
      availabilityStatus: pkg.availability?.status || 'sold_out',
      availableDates: pkg.availability?.availableDatesCount || 0,
      popularityScore: pkg.popularity?.popularity_score || 0,
      bookingCount: pkg.popularity?.booking_count || 0,
    });
  });

  // Format currency columns
  const currencyColumns = ['ntaPriceMin', 'ntaPriceMax', 'publishPriceMin', 'publishPriceMax', 'margin'];
  currencyColumns.forEach((colKey) => {
    const col = worksheet.getColumn(colKey);
    col.numFmt = '#,##0';
  });

  // Format rating column
  const ratingCol = worksheet.getColumn('rating');
  ratingCol.numFmt = '0.0';

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

