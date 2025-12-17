/**
 * E-Ticket PDF Template
 * Sesuai PRD 4.3.B - E-Ticket Generation
 * 
 * Generate PDF e-ticket for travel bookings
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ticketNumber: {
    fontSize: 12,
    opacity: 0.9,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: '#666',
  },
  value: {
    flex: 1,
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#e5e7eb',
    margin: '20 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '2 dashed #ccc',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
  warning: {
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    padding: 10,
    marginTop: 20,
    borderRadius: 5,
  },
});

export type ETicketData = {
  ticketNumber: string;
  bookingId: string;
  // Trip Info
  tripName: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  duration?: string;
  // Traveler Info
  travelers: Array<{
    name: string;
    idNumber?: string;
    phone?: string;
  }>;
  // Contact
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  // Itinerary
  itinerary?: Array<{
    date: string;
    activity: string;
    location?: string;
  }>;
  // Important Notes
  notes?: string[];
  // QR Code (base64)
  qrCode?: string;
};

export function ETicketPDF({ data }: { data: ETicketData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>E-TICKET</Text>
          <Text style={styles.ticketNumber}>Ticket No: {data.ticketNumber}</Text>
          <Text style={styles.ticketNumber}>Booking ID: {data.bookingId}</Text>
        </View>

        {/* Trip Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Trip:</Text>
            <Text style={styles.value}>{data.tripName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Destination:</Text>
            <Text style={styles.value}>{data.destination}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Departure:</Text>
            <Text style={styles.value}>{data.departureDate}</Text>
          </View>
          {data.returnDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Return:</Text>
              <Text style={styles.value}>{data.returnDate}</Text>
            </View>
          )}
          {data.duration && (
            <View style={styles.row}>
              <Text style={styles.label}>Duration:</Text>
              <Text style={styles.value}>{data.duration}</Text>
            </View>
          )}
        </View>

        {/* Travelers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travelers</Text>
          {data.travelers.map((traveler, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>
                {index + 1}. {traveler.name}
              </Text>
              {traveler.idNumber && (
                <Text style={{ fontSize: 10, color: '#666' }}>
                  ID: {traveler.idNumber}
                </Text>
              )}
              {traveler.phone && (
                <Text style={{ fontSize: 10, color: '#666' }}>
                  Phone: {traveler.phone}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Person</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.contactName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.contactPhone}</Text>
          </View>
          {data.contactEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{data.contactEmail}</Text>
            </View>
          )}
        </View>

        {/* Itinerary */}
        {data.itinerary && data.itinerary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {data.itinerary.map((item, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{item.date}</Text>
                <Text>{item.activity}</Text>
                {item.location && (
                  <Text style={{ fontSize: 10, color: '#666' }}>📍 {item.location}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* QR Code */}
        {data.qrCode && (
          <View>
            <Text style={{ textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>
              Scan QR Code for Check-in
            </Text>
            <View style={styles.qrPlaceholder}>
              <Text>[QR Code Image]</Text>
            </View>
          </View>
        )}

        {/* Important Notes */}
        {data.notes && data.notes.length > 0 && (
          <View style={styles.warning}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>⚠️ Important Notes:</Text>
            {data.notes.map((note, index) => (
              <Text key={index} style={{ marginBottom: 3 }}>
                • {note}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Please present this e-ticket at check-in</Text>
          <Text>Keep this document safe during your trip</Text>
          <Text style={{ marginTop: 10 }}>
            For assistance, contact: {data.contactPhone}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

