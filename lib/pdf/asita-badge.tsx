/**
 * ASITA Membership Badge Component for PDF Documents
 * Displays ASITA membership credentials on invoices, e-tickets, and vouchers
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    padding: '8 12',
    borderRadius: 4,
    marginBottom: 10,
  },
  badgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    padding: '4 8',
    borderRadius: 3,
  },
  logoContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainerCompact: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  logoTextCompact: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 7,
    fontWeight: 'bold',
    color: 'white',
  },
  nia: {
    fontSize: 8,
    color: '#93c5fd',
  },
  niaCompact: {
    fontSize: 6,
    color: '#93c5fd',
  },
  membershipType: {
    fontSize: 7,
    color: '#93c5fd',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  verified: {
    marginLeft: 'auto',
    backgroundColor: '#22c55e',
    padding: '2 6',
    borderRadius: 3,
  },
  verifiedText: {
    fontSize: 6,
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 6,
    color: '#d1d5db',
    marginTop: 3,
  },
});

export type ASITABadgeData = {
  nia: string;
  membershipType: 'regular' | 'premium' | 'corporate';
  dpdRegion?: string;
  memberSince?: string;
  isVerified?: boolean;
};

/**
 * Full ASITA Badge - for invoices and vouchers
 */
export function ASITABadge({ data }: { data: ASITABadgeData }) {
  const membershipLabels = {
    regular: 'Regular Member',
    premium: 'Premium Member',
    corporate: 'Corporate Member',
  };

  return (
    <View style={styles.badge}>
      {/* ASITA Logo Placeholder */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>ASITA</Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Anggota ASITA Indonesia</Text>
        <Text style={styles.nia}>NIA: {data.nia}</Text>
        <Text style={styles.membershipType}>
          {membershipLabels[data.membershipType]}
        </Text>
        {data.dpdRegion && (
          <Text style={styles.footer}>{data.dpdRegion}</Text>
        )}
      </View>
      
      {/* Verified Badge */}
      {data.isVerified !== false && (
        <View style={styles.verified}>
          <Text style={styles.verifiedText}>VERIFIED</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Compact ASITA Badge - for e-tickets and smaller documents
 */
export function ASITABadgeCompact({ data }: { data: ASITABadgeData }) {
  return (
    <View style={styles.badgeCompact}>
      <View style={styles.logoContainerCompact}>
        <Text style={styles.logoTextCompact}>A</Text>
      </View>
      <View>
        <Text style={styles.titleCompact}>Anggota ASITA</Text>
        <Text style={styles.niaCompact}>NIA: {data.nia}</Text>
      </View>
    </View>
  );
}

/**
 * ASITA Membership Info Block - for detailed display
 */
export function ASITAMembershipInfo({ data }: { data: ASITABadgeData }) {
  const membershipLabels = {
    regular: 'Regular',
    premium: 'Premium',
    corporate: 'Corporate',
  };

  const infoStyles = StyleSheet.create({
    container: {
      border: '1 solid #3b82f6',
      borderRadius: 5,
      padding: 12,
      marginBottom: 15,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: '1 solid #dbeafe',
    },
    headerLogo: {
      width: 40,
      height: 40,
      backgroundColor: '#1e3a8a',
      borderRadius: 20,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLogoText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: 'white',
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1e3a8a',
    },
    headerSubtitle: {
      fontSize: 9,
      color: '#6b7280',
    },
    row: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    label: {
      width: 100,
      fontSize: 9,
      color: '#6b7280',
    },
    value: {
      flex: 1,
      fontSize: 9,
      fontWeight: 'bold',
    },
    footer: {
      marginTop: 10,
      paddingTop: 8,
      borderTop: '1 solid #dbeafe',
      fontSize: 7,
      color: '#9ca3af',
      textAlign: 'center',
    },
  });

  return (
    <View style={infoStyles.container}>
      <View style={infoStyles.header}>
        <View style={infoStyles.headerLogo}>
          <Text style={infoStyles.headerLogoText}>ASITA</Text>
        </View>
        <View>
          <Text style={infoStyles.headerTitle}>Association of The Indonesian Tours & Travel Agencies</Text>
          <Text style={infoStyles.headerSubtitle}>Asosiasi Agen Perjalanan Wisata Indonesia</Text>
        </View>
      </View>
      
      <View style={infoStyles.row}>
        <Text style={infoStyles.label}>Nomor Induk Anggota</Text>
        <Text style={infoStyles.value}>{data.nia}</Text>
      </View>
      
      <View style={infoStyles.row}>
        <Text style={infoStyles.label}>Tipe Keanggotaan</Text>
        <Text style={infoStyles.value}>{membershipLabels[data.membershipType]}</Text>
      </View>
      
      {data.dpdRegion && (
        <View style={infoStyles.row}>
          <Text style={infoStyles.label}>DPD ASITA</Text>
          <Text style={infoStyles.value}>{data.dpdRegion}</Text>
        </View>
      )}
      
      {data.memberSince && (
        <View style={infoStyles.row}>
          <Text style={infoStyles.label}>Anggota Sejak</Text>
          <Text style={infoStyles.value}>{data.memberSince}</Text>
        </View>
      )}
      
      <Text style={infoStyles.footer}>
        Keanggotaan ASITA adalah jaminan profesionalitas dan legalitas usaha perjalanan wisata
      </Text>
    </View>
  );
}

