/**
 * Layout Components - Barrel Export
 */

// Legacy exports (deprecated, use new system below)
export { Container } from './container';
export type { ContainerProps } from './container';
export { Footer } from './footer';
export { Header } from './header';
export { MobileNav } from './mobile-nav';
export { Section } from './section';
export type { SectionProps } from './section';

// New standardized layout system (recommended)
export { AppHeader } from './app-header';
export { AppShell } from './app-shell';
export { BottomNavigation } from './bottom-navigation';
export { GuideBottomNavigation } from './guide-bottom-navigation';
export { GuideHeader } from './guide-header';
export { GuideShell } from './guide-shell';
export { OfflineBadge } from './offline-badge';
export { PageContainer, Section as PageSection } from './page-container';

