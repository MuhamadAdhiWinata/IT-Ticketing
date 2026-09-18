import type {
  Ticket,
  AppUser,
  CategoryItem,
  SubcategoryItem,
  VendorItem,
  TechnicianItem,
} from '~/types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_VENDORS,
  INITIAL_TECHNICIANS,
  INITIAL_TICKETS,
} from '~/utils/mockData';

const STORAGE_KEYS = {
  THEME_DARK: 'it_theme_dark',
  TICKETS: 'it_tickets_data',
  CATEGORIES: 'it_categories_data',
  SUBCATEGORIES: 'it_subcategories_data',
  VENDORS: 'it_vendors_data',
  TECHNICIANS: 'it_technicians_data',
  USERS: 'it_users_data',
};

export const StorageService = {
  getDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME_DARK);
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  },

  setDarkMode(isDark: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_DARK, isDark ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save dark mode', e);
    }
  },

  getTickets(): Ticket[] {
    if (typeof window === 'undefined') return INITIAL_TICKETS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (!saved) return INITIAL_TICKETS;
      const parsed = JSON.parse(saved);
      // Ensure requestedByName exists for backward compatibility/quick fix
      return parsed.map((t: any) => ({
        ...t,
        requestedBy: t.requestedBy || t.created_by,
        requestedByName: t.requestedByName || t.created_by_name,
        requestedByDept: t.requestedByDept || t.created_by_dept,
        audit_logs: t.audit_logs || []
      }));
    } catch (e) {
      console.error('Failed to load tickets', e);
      return INITIAL_TICKETS;
    }
  },

  saveTickets(tickets: Ticket[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets', e);
    }
  },

  getCategories(): CategoryItem[] {
    if (typeof window === 'undefined') return INITIAL_CATEGORIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories: CategoryItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getSubcategories(): SubcategoryItem[] {
    if (typeof window === 'undefined') return INITIAL_SUBCATEGORIES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_SUBCATEGORIES;
    } catch {
      return INITIAL_SUBCATEGORIES;
    }
  },

  saveSubcategories(subcategories: SubcategoryItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(subcategories));
  },

  getVendors(): VendorItem[] {
    if (typeof window === 'undefined') return INITIAL_VENDORS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  },

  saveVendors(vendors: VendorItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  },

  getTechnicians(): TechnicianItem[] {
    if (typeof window === 'undefined') return INITIAL_TECHNICIANS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
      return saved ? JSON.parse(saved) : INITIAL_TECHNICIANS;
    } catch {
      return INITIAL_TECHNICIANS;
    }
  },

  saveTechnicians(techs: TechnicianItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(techs));
  },

  getUsers(): AppUser[] {
    if (typeof window === 'undefined') return INITIAL_USERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: AppUser[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
};
