/**
 * Manifest PDF Template
 * Sesuai PRD - Manifest Generation
 * 
 * Generate PDF manifest for trip documentation
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
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
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #ddd',
  },
  tableCol: {
    flex: 1,
  },
  colNo: { width: 30 },
  colName: { flex: 2 },
  colId: { flex: 1.5 },
  colPhone: { flex: 1 },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 200,
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1 solid #000',
    marginTop: 50,
    paddingTop: 5,
  },
});

export type ManifestData = {
  manifestNumber: string;
  tripName: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  guideName?: string;
  guidePhone?: string;
  // Participants
  participants: Array<{
    no: number;
    name: string;
    idNumber?: string;
    phone?: string;
    emergencyContact?: string;
    notes?: string;
  }>;
  // Summary
  totalPax: number;
  // Notes
  notes?: string;
};

export function ManifestPDF({ data }: { data: ManifestData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MANIFEST PERJALANAN</Text>
          <Text style={styles.subtitle}>Trip Manifest Document</Text>
          <Text style={styles.subtitle}>No: {data.manifestNumber}</Text>
        </View>

        {/* Trip Info */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ width: 100, fontWeight: 'bold' }}>Trip:</Text>
            <Text style={{ flex: 1 }}>{data.tripName}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ width: 100, fontWeight: 'bold' }}>Destination:</Text>
            <Text style={{ flex: 1 }}>{data.destination}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ width: 100, fontWeight: 'bold' }}>Departure:</Text>
            <Text style={{ flex: 1 }}>{data.departureDate}</Text>
          </View>
          {data.returnDate && (
            <View style={{ flexDirection: 'row', marginBottom: 5 }}>
              <Text style={{ width: 100, fontWeight: 'bold' }}>Return:</Text>
              <Text style={{ flex: 1 }}>{data.returnDate}</Text>
            </View>
          )}
          {data.guideName && (
            <View style={{ flexDirection: 'row', marginBottom: 5 }}>
              <Text style={{ width: 100, fontWeight: 'bold' }}>Guide:</Text>
              <Text style={{ flex: 1 }}>{data.guideName}</Text>
              {data.guidePhone && <Text> ({data.guidePhone})</Text>}
            </View>
          )}
        </View>

        {/* Participants Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Participants ({data.totalPax} pax)
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colName}>Name</Text>
              <Text style={styles.colId}>ID Number</Text>
              <Text style={styles.colPhone}>Phone</Text>
            </View>
            {data.participants.map((participant) => (
              <View key={participant.no} style={styles.tableRow}>
                <Text style={styles.colNo}>{participant.no}</Text>
                <Text style={styles.colName}>{participant.name}</Text>
                <Text style={styles.colId}>{participant.idNumber || '-'}</Text>
                <Text style={styles.colPhone}>{participant.phone || '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Guide Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Operator Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

