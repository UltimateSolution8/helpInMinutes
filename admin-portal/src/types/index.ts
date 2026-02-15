// User & Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'super_admin' | 'ops_manager' | 'support' | 'finance';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Helper Types
export interface Helper {
  id: string;
  userId: string;
  user: User;
  skills: Skill[];
  bio: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  isOnline: boolean;
  isAvailable: boolean;
  kycStatus: KycStatus;
  location?: GeoLocation;
  createdAt: string;
  updatedAt: string;
}

export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'documents_requested';

export interface KycDocument {
  id: string;
  helperId: string;
  type: KycDocumentType;
  documentUrl: string;
  status: KycStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type KycDocumentType = 
  | 'aadhaar_card' 
  | 'pan_card' 
  | 'driving_license' 
  | 'voter_id' 
  | 'passport'
  | 'bank_statement'
  | 'photo';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// Task Types
export interface Task {
  id: string;
  customerId: string;
  customer: User;
  helperId?: string;
  helper?: Helper;
  categoryId: string;
  category: Category;
  skillId: string;
  skill: Skill;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  location: GeoLocation;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  price: number;
  platformFee: number;
  helperEarnings: number;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 
  | 'pending' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Skill & Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
  subcategories?: Category[];
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category: Category;
  icon?: string;
  isActive: boolean;
  estimatedDuration?: number;
  basePrice?: number;
}

// Payment Types
export interface Payment {
  id: string;
  taskId: string;
  task: Task;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'net_banking' | 'wallet';

export interface Payout {
  id: string;
  helperId: string;
  helper: Helper;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'bank_transfer' | 'upi' | 'paytm';

export interface LedgerEntry {
  id: string;
  helperId: string;
  helper: Helper;
  type: LedgerEntryType;
  amount: number;
  balance: number;
  description: string;
  taskId?: string;
  payoutId?: string;
  createdAt: string;
}

export type LedgerEntryType = 
  | 'task_payment' 
  | 'payout' 
  | 'refund' 
  | 'bonus' 
  | 'adjustment';

// Audit Types
export interface AuditLog {
  id: string;
  userId: string;
  user: User;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'approve' 
  | 'reject' 
  | 'cancel';

// Dispute Types
export interface Dispute {
  id: string;
  taskId: string;
  task: Task;
  raisedBy: 'customer' | 'helper';
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

// Dashboard Types
export interface DashboardMetrics {
  activeTasks: number;
  onlineHelpers: number;
  bookingsToday: number;
  completionRate: number;
  revenueToday: number;
  revenueThisMonth: number;
  newHelpersThisMonth: number;
  pendingKycCount: number;
}

export interface ActivityFeed {
  id: string;
  type: 'task' | 'kyc' | 'payout' | 'dispute' | 'user';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  helperId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface HelperFilters {
  status?: 'active' | 'inactive' | 'online';
  kycStatus?: KycStatus;
  skills?: string[];
  city?: string;
  minRating?: number;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

// Socket Events
export interface SocketEvents {
  'task:created': Task;
  'task:updated': Task;
  'task:assigned': Task;
  'task:completed': Task;
  'helper:online': { helperId: string; status: boolean };
  'helper:location': { helperId: string; location: GeoLocation };
  'payment:received': Payment;
  'dispute:raised': Dispute;
}
