// Complaint Categories
export type ComplaintCategory =
  | "DELIVERY"
  | "VEHICLE_CONDITION"
  | "MISSING_ITEMS"
  | "ADMIN_FINANCE"
  | "WARRANTY"
  | "COMMUNICATION"
  | "OTHER";

// Complaint Status
export type ComplaintStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "AWAITING_CUSTOMER"
  | "AWAITING_INTERNAL"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

// Priority levels
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// Delivery Status
export type DeliveryStatus =
  | "PENDING"
  | "PREPARING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED";

// Warranty Types
export type WarrantyType =
  | "STANDARD_90"
  | "CARSA_COVER_12"
  | "CARSA_COVER_24"
  | "CARSA_COVER_48";

// Message roles
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

// Action types
export type ActionType =
  | "REFUND"
  | "COMPENSATION"
  | "RESHIP"
  | "CREATE_TICKET"
  | "SEND_EMAIL"
  | "SCHEDULE_CALLBACK"
  | "ESCALATE";

// Action status
export type ActionStatus =
  | "PENDING"
  | "APPROVED"
  | "EXECUTED"
  | "FAILED"
  | "CANCELLED";

// Intent types for AI classification
export type Intent =
  | "DELIVERY_STATUS"
  | "DELIVERY_PROBLEM"
  | "VEHICLE_DEFECT"
  | "MISSING_ITEM"
  | "REFUND_REQUEST"
  | "WARRANTY_QUESTION"
  | "WARRANTY_CLAIM"
  | "FINANCE_ISSUE"
  | "ADMIN_ISSUE"
  | "SPEAK_TO_HUMAN"
  | "GENERAL_QUESTION"
  | "GREETING"
  | "OTHER";

// Chat message interface
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  intent?: Intent;
  confidence?: number;
  sentiment?: number;
}

// AI Response structure
export interface AIResponse {
  message: string;
  intent: Intent;
  confidence: number;
  action: AIAction | null;
  shouldEscalate: boolean;
  escalateReason: string | null;
  dataNeeded: string[] | null;
}

// AI Action
export interface AIAction {
  type: ActionType;
  params: Record<string, unknown>;
}

// Customer context for AI
export interface CustomerContext {
  id: string;
  name: string;
  email: string;
  phone?: string;
  orders: OrderContext[];
  previousComplaints: number;
  isVulnerable?: boolean;
}

// Order context for AI
export interface OrderContext {
  id: string;
  orderNumber: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  purchasePrice: number;
  deliveryStatus: DeliveryStatus;
  deliveryDate?: Date;
  deliveryAddress: string;
  warrantyExpiry: Date;
  warrantyType: WarrantyType;
  accessories: string[];
  accessoriesDelivered: boolean;
}

// Session state
export interface SessionState {
  sessionId: string;
  customerId?: string;
  conversationId?: string;
  complaintId?: string;
  messages: ChatMessage[];
  context?: CustomerContext;
  currentOrder?: OrderContext;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Chat session response
export interface ChatSessionResponse {
  sessionId: string;
  conversationId: string;
  welcomeMessage: string;
}

// Chat message request
export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

// Chat message response
export interface ChatMessageResponse {
  message: string;
  intent?: Intent;
  confidence?: number;
  actionTaken?: {
    type: ActionType;
    description: string;
  };
  shouldEscalate: boolean;
  escalateReason?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  aiResolved: number;
  aiResolvedPercent: number;
  avgResolutionTimeHours: number;
  escalatedCount: number;
  todayComplaints: number;
  csatAverage: number;
}

// Complaint list item
export interface ComplaintListItem {
  id: string;
  referenceNumber: string;
  customerName: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: Priority;
  aiHandled: boolean;
  createdAt: Date;
  vehicleInfo?: string;
}
