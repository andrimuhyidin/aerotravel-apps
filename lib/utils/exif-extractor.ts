/**
 * EXIF Data Extractor Utility
 * Extract GPS coordinates and timestamp from photo EXIF metadata
 */

import exifr from 'exifr';

import { logger } from '@/lib/utils/logger';

export type EXIFData = {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  altitude?: number;
  accuracy?: number;
  make?: string;
  model?: string;
  orientation?: number;
};

/**
 * Extract EXIF data from image file buffer
 * @param fileBuffer - Image file as ArrayBuffer or Buffer
 * @returns EXIF data including GPS coordinates and timestamp
 */
export async function extractEXIFData(
  fileBuffer: ArrayBuffer | Buffer
): Promise<EXIFData | null> {
  try {
    // Convert Buffer to ArrayBuffer if needed
    const buffer =
      fileBuffer instanceof Buffer ? fileBuffer.buffer : fileBuffer;

    // Extract EXIF data
    const exifData = await exifr.parse(
      buffer as any,
      {
        gps: true,
        exif: true,
        ifd0: true,
        ifd1: true,
        translateKeys: false,
        translateValues: false,
        reviveValues: true,
        sanitize: true,
        mergeOutput: true,
      } as unknown
    );

    if (!exifData) {
      return null;
    }

    const result: EXIFData = {};

    // Extract GPS coordinates
    if (exifData.latitude && exifData.longitude) {
      result.latitude = exifData.latitude;
      result.longitude = exifData.longitude;
    } else if (exifData.GPSLatitude && exifData.GPSLongitude) {
      result.latitude = exifData.GPSLatitude;
      result.longitude = exifData.GPSLongitude;
    }

    // Extract altitude if available
    if (exifData.GPSAltitude) {
      result.altitude = exifData.GPSAltitude;
    }

    // Extract timestamp
    if (exifData.DateTimeOriginal) {
      result.timestamp = new Date(exifData.DateTimeOriginal).toISOString();
    } else if (exifData.DateTime) {
      result.timestamp = new Date(exifData.DateTime).toISOString();
    } else if (exifData.CreateDate) {
      result.timestamp = new Date(exifData.CreateDate).toISOString();
    }

    // Extract camera info
    if (exifData.Make) {
      result.make = exifData.Make;
    }
    if (exifData.Model) {
      result.model = exifData.Model;
    }

    // Extract orientation
    if (exifData.Orientation) {
      result.orientation = exifData.Orientation;
    }

    // GPS accuracy (if available)
    if (exifData.GPSHPositioningError) {
      result.accuracy = exifData.GPSHPositioningError;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    logger.warn('Failed to extract EXIF data', { error });
    return null;
  }
}

/**
 * Extract EXIF data from File object (client-side)
 * @param file - File object from input
 * @returns EXIF data including GPS coordinates and timestamp
 */
export async function extractEXIFFromFile(
  file: File
): Promise<EXIFData | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await extractEXIFData(arrayBuffer);
  } catch (error) {
    logger.warn('Failed to extract EXIF from file', { error });
    return null;
  }
}
