/**
 * Itinerary PDF Template
 * Detailed itinerary document for bookings
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  dayItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  time: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  activity: {
    marginBottom: 3,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 9,
    color: '#666',
  },
});

export type ItineraryData = {
  bookingCode: string;
  packageName: string;
  destination: string;
  tripDate: string;
  durationDays: number;
  durationNights: number;
  companyName: string;
  itinerary: Array<{
    day: number;
    date: string;
    activities: Array<{
      time: string;
      activity: string;
      location?: string;
    }>;
  }>;
  inclusions?: string[];
  exclusions?: string[];
  meetingPoint?: string;
  language?: 'id' | 'en';
};

export function ItineraryPDF({ data }: { data: ItineraryData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'ITINERARY PERJALANAN',
      bookingCode: 'Kode Booking',
      package: 'Paket',
      destination: 'Destinasi',
      tripDate: 'Tanggal Trip',
      duration: 'Durasi',
      day: 'Hari',
      night: 'Malam',
      dayTitle: 'Hari',
      inclusions: 'Termasuk',
      exclusions: 'Tidak Termasuk',
      meetingPoint: 'Titik Kumpul',
    },
    en: {
      title: 'TRAVEL ITINERARY',
      bookingCode: 'Booking Code',
      package: 'Package',
      destination: 'Destination',
      tripDate: 'Trip Date',
      duration: 'Duration',
      day: 'Day',
      night: 'Night',
      dayTitle: 'Day',
      inclusions: 'Inclusions',
      exclusions: 'Exclusions',
      meetingPoint: 'Meeting Point',
    },
  };

  const t = texts[lang];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.companyName}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t.title}</Text>

        {/* Booking Info */}
        <View style={styles.section}>
          <Text>{t.bookingCode}: {data.bookingCode}</Text>
          <Text>{t.package}: {data.packageName}</Text>
          <Text>{t.destination}: {data.destination}</Text>
          <Text>{t.tripDate}: {data.tripDate}</Text>
          <Text>
            {t.duration}: {data.durationDays} {t.day} {data.durationNights} {t.night}
          </Text>
        </View>

        {/* Meeting Point */}
        {data.meetingPoint && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.meetingPoint}</Text>
            <Text>{data.meetingPoint}</Text>
          </View>
        )}

        {/* Itinerary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinerary</Text>
          {data.itinerary.map((day, idx) => (
            <View key={idx} style={styles.dayItem}>
              <Text style={styles.dayTitle}>
                {t.dayTitle} {day.day} - {day.date}
              </Text>
              {day.activities.map((activity, actIdx) => (
                <View key={actIdx}>
                  <Text style={styles.time}>{activity.time}</Text>
                  <Text style={styles.activity}>
                    {activity.activity}
                    {activity.location && ` - ${activity.location}`}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Inclusions */}
        {data.inclusions && data.inclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.inclusions}</Text>
            {data.inclusions.map((item, idx) => (
              <Text key={idx}>• {item}</Text>
            ))}
          </View>
        )}

        {/* Exclusions */}
        {data.exclusions && data.exclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.exclusions}</Text>
            {data.exclusions.map((item, idx) => (
              <Text key={idx}>• {item}</Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by {data.companyName}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateItineraryPDF(data: ItineraryData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = <ItineraryPDF data={data} />;
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

