import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export type UserRole = 'admin' | 'auditor' | 'accountant' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  role: UserRole;
  provider: 'email' | 'google';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface StoredInvoice {
  id: string;
  userId: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  uploadDate: string;
  isTaxInvoice: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  supplierName: string;
  supplierTrn: string;
  customerName: string;
  customerTrn: string;
  description: string;
  category: string;
  emirate: string;
  currency: string;
  exchangeRate: number;
  taxableValueOriginal: number;
  vatRate: string;
  vatAmountOriginal: number;
  totalOriginal: number;
  taxableValueAED: number;
  vatAmountAED: number;
  totalAED: number;
  lineItems: any[];
  validationIssues: any[];
  isValid: boolean;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'batch_upload' | 'role_change' | 'login';
  targetId?: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  invoices: StoredInvoice[];
  auditLogs: AuditLog[];
  settings: {
    organizationName: string;
    defaultCurrency: string;
    ftaTaxPeriod: string;
  };
}

// Initial Database Template
function getInitialDb(): DatabaseSchema {
  // Pre-seed the system Administrator with user's email
  const initialAdmin: User = {
    id: 'user-admin-default',
    email: 'pdc-subcom@icaiauh.org',
    name: 'Senior Tax Administrator',
    passwordHash: bcrypt.hashSync('Admin@12345', 10),
    role: 'admin',
    provider: 'google',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  return {
    users: [initialAdmin],
    invoices: [],
    auditLogs: [
      {
        id: 'log-1',
        userId: initialAdmin.id,
        userName: initialAdmin.name,
        userRole: 'admin',
        action: 'login',
        details: 'System initialized with default Tax Administrator',
        timestamp: new Date().toISOString(),
      },
    ],
    settings: {
      organizationName: 'UAE Tax Operations Group',
      defaultCurrency: 'AED',
      ftaTaxPeriod: 'Q4-2026',
    },
  };
}

class Database {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.db = this.load();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading database file, reinitializing:', e);
    }
    const initial = getInitialDb();
    this.save(initial);
    return initial;
  }

  private save(data: DatabaseSchema) {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  // --- Users Operations ---
  getUsers(): User[] {
    return this.db.users;
  }

  getUserById(id: string): User | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): User {
    const newUser: User = {
      ...user,
      id: 'user-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.db.users.push(newUser);
    this.save(this.db);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.db.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return undefined;
    this.db.users[userIndex] = { ...this.db.users[userIndex], ...updates };
    this.save(this.db);
    return this.db.users[userIndex];
  }

  // --- Invoices Operations ---
  getInvoices(userId?: string): StoredInvoice[] {
    if (userId) {
      return this.db.invoices.filter((i) => i.userId === userId);
    }
    return this.db.invoices;
  }

  getInvoiceById(id: string): StoredInvoice | undefined {
    return this.db.invoices.find((i) => i.id === id);
  }

  saveInvoice(invoice: StoredInvoice): StoredInvoice {
    const index = this.db.invoices.findIndex((i) => i.id === invoice.id);
    invoice.updatedAt = new Date().toISOString();
    if (index >= 0) {
      this.db.invoices[index] = invoice;
    } else {
      this.db.invoices.push(invoice);
    }
    this.save(this.db);
    return invoice;
  }

  saveInvoicesBatch(invoices: StoredInvoice[]): StoredInvoice[] {
    const now = new Date().toISOString();
    invoices.forEach((inv) => {
      inv.updatedAt = now;
      const index = this.db.invoices.findIndex((i) => i.id === inv.id);
      if (index >= 0) {
        this.db.invoices[index] = inv;
      } else {
        this.db.invoices.push(inv);
      }
    });
    this.save(this.db);
    return invoices;
  }

  deleteInvoice(id: string): boolean {
    const initLen = this.db.invoices.length;
    this.db.invoices = this.db.invoices.filter((i) => i.id !== id);
    if (this.db.invoices.length !== initLen) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  deleteInvoicesBatch(ids: string[]): number {
    const idSet = new Set(ids);
    const prevCount = this.db.invoices.length;
    this.db.invoices = this.db.invoices.filter((i) => !idSet.has(i.id));
    const deletedCount = prevCount - this.db.invoices.length;
    if (deletedCount > 0) {
      this.save(this.db);
    }
    return deletedCount;
  }

  // --- Audit Logs ---
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(newLog);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 500);
    }
    this.save(this.db);
    return newLog;
  }

  getAuditLogs(): AuditLog[] {
    return this.db.auditLogs;
  }
}

export const db = new Database();
