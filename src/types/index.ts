export type PaymentType = "cash" | "bank" | "credit";
export type UserRole = "admin" | "staff";
export type UnitType =
  | "pcs"
  | "meters"
  | "sq.meters"
  | "kg"
  | "liters"
  | "box"
  | "set"
  | "roll";
export type QuotationStatus = "quote" | "sale" | "reject";
export type DeliveryStatus = "pending" | "delivered" | "partial";

export interface IActionPermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve?: boolean;
  export?: boolean;
}

export interface IUserPermissions {
  [key: string]: IActionPermission;
}

// ─── User ───────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: IUserPermissions;
  isActive: boolean;
  createdAt: Date;
}

// ─── Item ───────────────────────────────────────────
export interface IBatch {
  purchaseId?: string;
  purchaseNumber?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  createdAt: Date;
}

export interface IItem {
  _id: string;
  itemNumber: string;
  name: string;
  unit: UnitType;
  category?: string;
  salesAmount: number;
  purchaseAmount: number;
  quantity: number;
  stockValue: number;
  manufacturingDate?: string;
  expiryDate?: string;
  supplierRef?: string;
  supplierName?: string;
  batches?: IBatch[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
}

export interface IItemForm {
  itemNumber?: string;
  name: string;
  unit?: UnitType;
  category?: string;
  salesAmount?: number;
  purchaseAmount?: number;
  quantity?: number;
  supplierRef?: string;
  supplierName?: string;
}

// ─── Customer ───────────────────────────────────────
export interface IBalanceHistory {
  date: string;
  amount: number;
  type: "payment" | "adjustment";
  paymentMethod?: "cash" | "bank" | "credit";
  note?: string;
}

export interface ICustomer {
  _id: string;
  customerNumber: string;
  name: string;
  mobile: string;
  address?: string;
  openingBalance: number;
  creditBalance: number;
  balanceHistory?: IBalanceHistory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
}

export interface ICustomerForm {
  customerNumber: string;
  name: string;
  mobile: string;
  address?: string;
  openingBalance?: number;
  creditBalance?: number;
}

export interface ICustomerFilter extends ITableFilter {
  startDate?: string;
  endDate?: string;
  purchaseFilter?: "higher" | "lower";
}

// ─── Supplier ───────────────────────────────────────
export interface ISupplier {
  _id: string;
  supplierNumber: string;
  name: string;
  mobile?: string;
  itemsProvided: string[];
  openingBalance: number;
  creditBalance: number;
  balanceHistory?: IBalanceHistory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
}

export interface ISupplierForm {
  supplierNumber: string;
  name: string;
  mobile?: string;
  itemsProvided?: string[];
  openingBalance?: number;
}

// ─── Quotation ──────────────────────────────────────
export interface IQuotationItem {
  itemId?: string;
  itemNumber?: string;
  itemName: string;
  description?: string;
  unit: UnitType;
  quantity: number;
  price: number;
  discount: number;
  color?: string;
  material?: string;
  size?: string;
  subtotal?: number;
  taxAmount?: number;
  total: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  bom?: {
    materialId: string;
    materialName: string;
    materialCode: string;
    unit: string;
    batchNumber?: string;
    pricePerUnit?: number;
    quantity: number;
    subtotal?: number;
  }[];
  variants?: {
    colors: string[];
    sizes: string[];
    finishes: string[];
  };
  pricing?: {
    materialCost: number;
    laborCost: number;
    extraCost: number;
    totalCost: number;
    profitMargin: number;
    sellingPrice: number;
    discountPrice?: number;
  };
}

export interface IQuotation {
  _id: string;
  quotationNumber: string;
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  customerAddress?: string;
  items: IQuotationItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: QuotationStatus;
  deliveryStatus: DeliveryStatus;
  deliveryDate?: string;
  deliveredDate?: string;
  notes?: string;
  validUntil?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  convertedToSaleId?: string;
  validationError?: string;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
}

export interface IQuotationForm {
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  customerAddress?: string;
  items: IQuotationItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: QuotationStatus;
  deliveryStatus: DeliveryStatus;
  deliveryDate?: string;
  notes?: string;
  validUntil?: string;
  date: string;
}

export interface IQuotationFilter extends ITableFilter {
  startDate?: string;
  endDate?: string;
  status?: QuotationStatus;
  deliveryStatus?: DeliveryStatus;
}

// ─── Sale ───────────────────────────────────────────
export interface ISaleItem {
  itemId: string;
  itemNumber: string;
  itemName: string;
  unit?: UnitType;
  quantity: number;
  price: number;
  discount: number;
  isFOC?: boolean;
  manufacturingDate?: string;
  expiryDate?: string;
  batch?: string;
  color?: string;
  material?: string;
  size?: string;
  subtotal?: number;
  taxAmount?: number;
  total: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  bom?: {
    materialId: string;
    materialName: string;
    materialCode: string;
    unit: string;
    batchNumber?: string;
    pricePerUnit?: number;
    quantity: number;
    subtotal?: number;
  }[];
  variants?: {
    colors: string[];
    sizes: string[];
    finishes: string[];
  };
  pricing?: {
    materialCost: number;
    laborCost: number;
    extraCost: number;
    totalCost: number;
    profitMargin: number;
    sellingPrice: number;
    discountPrice?: number;
  };
}

export interface ISale {
  _id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  customerMobile?: string;
  customerAddress?: string;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  advancePaid?: number;
  remarks?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
  isTaxInvoice?: boolean;
  deliveryDate?: string;
  deliveryAddress?: string;
}

export interface ISaleForm {
  customerId: string;
  customerName: string;
  customerNumber: string;
  customerMobile?: string;
  customerAddress?: string;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  advancePaid?: number;
  remarks?: string;
  date: string;
  isTaxInvoice?: boolean;
  deliveryDate?: string;
  deliveryAddress?: string;
}

// ─── Purchase ───────────────────────────────────────
export interface IPurchaseItem {
  itemId: string;
  itemNumber: string;
  itemName: string;
  unit?: UnitType;
  quantity: number;
  price: number;
  sellingPrice: number;
  manufacturingDate: string;
  expiryDate: string;
  batch?: string;
  subtotal?: number;
  taxAmount?: number;
  total: number;
}

export interface IPurchase {
  _id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  supplierNumber: string;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
  isTaxInvoice?: boolean;
}

export interface IPurchaseForm {
  supplierId: string;
  supplierName: string;
  supplierNumber: string;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  date: string;
  isTaxInvoice?: boolean;
}

// ─── Expense ────────────────────────────────────────
export interface IExpense {
  _id: string;
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  date: Date;
  reference?: string;
  description?: string;
  paymentType: PaymentType;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { _id: string; name: string };
  updatedBy?: { _id: string; name: string };
}

export interface IExpenseForm {
  title: string;
  category: string;
  amount: number;
  date: string;
  reference?: string;
  description?: string;
  paymentType: PaymentType;
}

export interface IExpenseFilter extends ITableFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
}

// ─── Dashboard ──────────────────────────────────────
export interface IKpiData {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalRevenue: number;
  totalCustomers: number;
  totalItems: number;
  totalSuppliers: number;
  totalReceivable: number;
  totalPayable: number;
  totalQuotations?: number;
  pendingQuotations?: number;
  cashSales?: number;
  bankSales?: number;
  creditSales?: number;
  cashPurchases?: number;
  bankPurchases?: number;
  creditPurchases?: number;
}

export interface IChartData {
  month: string;
  sales: number;
  purchases: number;
  expenses: number;
  revenue: number;
}

// ─── API Response ───────────────────────────────────
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Table / Filter ─────────────────────────────────
export interface ITableFilter {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ISaleFilter extends ITableFilter {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  paymentType?: PaymentType;
}

// ─── Select Option (react-select) ───────────────────
export interface ISelectOption {
  value: string;
  label: string;
  data?: IItem | ICustomer | ISupplier;
}

// ─── Sale Return ────────────────────────────────────
export interface ISaleReturn {
  _id: string;
  returnNumber: string;
  saleId: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  items: ISaleItem[];
  total: number;
  reason?: string;
  date: Date;
  createdAt: Date;
  createdBy?: { _id: string; name: string };
}

// ─── Damaged Item ───────────────────────────────────
export interface IDamagedItem {
  _id: string;
  itemId: string;
  itemName: string;
  itemNumber: string;
  quantity: number;
  unit?: UnitType;
  reason?: string;
  date: Date;
  createdAt: Date;
  createdBy?: { _id: string; name: string };
}
