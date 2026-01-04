type FooterProps = {
  locale: string;
};

// Mobile apps don't use traditional footers
// Navigation is handled by bottom nav, links go in menu overlay
export function Footer(_props: FooterProps) {
  return null;
}
