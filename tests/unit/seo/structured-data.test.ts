/**
 * Unit Tests - SEO Structured Data
 */

import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generatePackageSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateReviewSchema,
  serializeSchema,
} from '@/lib/seo/structured-data';

describe('SEO Structured Data', () => {
  describe('generateOrganizationSchema', () => {
    it('should generate valid organization schema', () => {
      const schema = generateOrganizationSchema();
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('TravelAgency');
      expect(schema.name).toBe('MyAeroTravel');
    });

    it('should include contact point', () => {
      const schema = generateOrganizationSchema();
      
      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
    });
  });

  describe('generateWebsiteSchema', () => {
    it('should generate valid website schema', () => {
      const schema = generateWebsiteSchema();
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.potentialAction).toBeDefined();
    });

    it('should include search action', () => {
      const schema = generateWebsiteSchema();
      
      expect(schema.potentialAction['@type']).toBe('SearchAction');
    });
  });

  describe('generatePackageSchema', () => {
    it('should generate valid package schema', () => {
      const schema = generatePackageSchema({
        name: 'Test Package',
        description: 'A test package',
        slug: 'test-package',
        price: 1500000,
        destination: 'Pahawang',
      });
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('TouristTrip');
      expect(schema.name).toBe('Test Package');
    });

    it('should include offers with price', () => {
      const schema = generatePackageSchema({
        name: 'Test Package',
        description: 'A test package',
        slug: 'test-package',
        price: 1500000,
        destination: 'Pahawang',
      });
      
      expect(schema.offers).toBeDefined();
      expect((schema.offers as { price: number }).price).toBe(1500000);
    });

    it('should include aggregate rating if provided', () => {
      const schema = generatePackageSchema({
        name: 'Test Package',
        description: 'A test package',
        slug: 'test-package',
        price: 1500000,
        destination: 'Pahawang',
        rating: 4.5,
        reviewCount: 100,
      });
      
      expect(schema.aggregateRating).toBeDefined();
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate breadcrumb list', () => {
      const schema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Packages', url: '/packages' },
      ]);
      
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
    });

    it('should have correct positions', () => {
      const schema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Packages', url: '/packages' },
      ]);
      
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
    });
  });

  describe('generateFAQSchema', () => {
    it('should generate FAQ page schema', () => {
      const schema = generateFAQSchema([
        { question: 'What is this?', answer: 'This is a test.' },
      ]);
      
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(1);
    });
  });

  describe('generateReviewSchema', () => {
    it('should generate review schema', () => {
      const schema = generateReviewSchema({
        author: 'John Doe',
        rating: 5,
        reviewBody: 'Great experience!',
        datePublished: '2024-01-01',
        itemReviewed: { name: 'Test Package', type: 'TouristTrip' },
      });
      
      expect(schema['@type']).toBe('Review');
      expect(schema.author.name).toBe('John Doe');
    });
  });

  describe('serializeSchema', () => {
    it('should serialize schema to JSON string', () => {
      const schema = { '@type': 'Test', name: 'Test' };
      const serialized = serializeSchema(schema);
      
      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toEqual(schema);
    });
  });
});

