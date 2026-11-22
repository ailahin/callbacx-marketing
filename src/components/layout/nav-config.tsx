/**
 * CALLBACX TECHNOLOGY - Shared navigation configuration
 * Single source of truth for all site links used in header, footer, and mobile menu.
 */

import type { NavItem } from "@/components/layout/Header";
import type { FooterColumn, FooterLink } from "@/components/layout/Footer";

export const mainNavigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About CALLBACX TECHNOLOGY", href: "/about" },
  { label: "For Brands", href: "/for-brands" },
  { label: "For Creators", href: "/for-creators" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
];

export const headerActions: NavItem[] = [
  { label: "Login", href: "/login" },
  { label: "Join as Creator", href: "/registration" },
];

export const headerCTA: NavItem = {
  label: "Start a Campaign",
  href: "/contact",
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Services", href: "/services" },
      { label: "For Brands", href: "/for-brands" },
      { label: "For Creators", href: "/for-creators" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About CALLBACX TECHNOLOGY", href: "/about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];

export const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
];

export const socialLinks = [
  {
    label: "Twitter",
    href: "#",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163C3.527 2.163 2.163 3.527 2.163 12c0 8.473 1.364 9.837 9.837 9.837 8.473 0 9.837-1.364 9.837-9.837 0-8.473-1.364-9.837-9.837-9.837zm0 1.872c4.392 0 7.964 3.572 7.964 7.964s-3.572 7.964-7.964 7.964-7.964-3.572-7.964-7.964 3.572-7.964 7.964-7.964zm0 12.83c2.687 0 4.873-2.186 4.873-4.873s-2.186-4.873-4.873-4.873-4.873 2.186-4.873 4.873 2.186 4.873 4.873 4.873zM12 7.03c-1.342 0-2.432 1.09-2.432 2.432s1.09 2.432 2.432 2.432 2.432-1.09 2.432-2.432-1.09-2.432-2.432-2.432zm0 10.678c-1.342 0-2.432-1.09-2.432-2.432s1.09-2.432 2.432-2.432 2.432 1.09 2.432 2.432-1.09 2.432-2.432 2.432z" />
      </svg>
    ),
  },
];


