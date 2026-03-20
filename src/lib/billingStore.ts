// Mock data for billingStore since Supabase is removed
// Full migration to Node/Express backend for billing is pending

// ──── Types ────

export interface FeeStructure {
  id: string;
  class_id: string;
  fee_type: string;
  amount: number;
  frequency: string;
  academic_year: string;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  student_name: string;
  class_id: string;
  billing_period: string;
  subtotal: number;
  discount_amount: number;
  fine_amount: number;
  net_amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  fee_type: string;
  amount: number;
}

export interface Payment {
  id: string;
  payment_number: string;
  student_id: string;
  invoice_id: string | null;
  student_name: string;
  class_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface Discount {
  id: string;
  student_id: string;
  discount_type: string;
  value: number;
  is_percentage: boolean;
  reason: string | null;
  academic_year: string;
  is_active: boolean;
}

export interface Fine {
  id: string;
  student_id: string;
  fine_type: string;
  amount: number;
  reason: string | null;
  is_paid: boolean;
  created_at: string;
}

// ──── Fee Structures ────

export async function getFeeStructures(classId?: string) {
  return [] as FeeStructure[];
}

export async function createFeeStructure(fs: Omit<FeeStructure, 'id' | 'created_at'>) {
  throw new Error("Billing backend not yet implemented");
}

export async function updateFeeStructure(id: string, updates: Partial<FeeStructure>) {
  throw new Error("Billing backend not yet implemented");
}

export async function deleteFeeStructure(id: string) {
  throw new Error("Billing backend not yet implemented");
}

// ──── Invoices ────

export async function getInvoices(filters?: { student_id?: string; status?: string; class_id?: string }) {
  return [] as Invoice[];
}

export async function getInvoiceItems(invoiceId: string) {
  return [] as InvoiceItem[];
}

export async function createInvoice(
  studentId: string,
  studentName: string,
  classId: string,
  billingPeriod: string,
  dueDate: string,
  items: { fee_type: string; amount: number }[],
  discountAmount: number = 0,
  fineAmount: number = 0
) {
  throw new Error("Billing backend not yet implemented");
}

// ──── Payments ────

export async function getPayments(filters?: { student_id?: string; invoice_id?: string }) {
  return [] as Payment[];
}

export async function recordPayment(payment: any) {
  throw new Error("Billing backend not yet implemented");
}

// ──── Discounts ────

export async function getDiscounts(studentId?: string) {
  return [] as Discount[];
}

export async function createDiscount(discount: Omit<Discount, 'id'>) {
  throw new Error("Billing backend not yet implemented");
}

// ──── Fines ────

export async function getFines(studentId?: string) {
  return [] as Fine[];
}

export async function createFine(fine: Omit<Fine, 'id' | 'created_at'>) {
  throw new Error("Billing backend not yet implemented");
}

// ──── Dashboard Stats ────

export async function getBillingStats() {
  return { 
    totalCollected: 0, 
    pendingFees: 0, 
    todayPayments: 0, 
    monthlyRevenue: 0, 
    defaultersCount: 0, 
    totalInvoices: 0 
  };
}
