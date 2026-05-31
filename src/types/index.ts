export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  status: string
  avatarUrl?: string
  timezone?: string
  language?: string
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  status: string
  subscriptionPlan: string
  subscriptionStatus: string
  trialEndsAt?: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  customDomain?: string
  chatbotEnabled: boolean
  whatsappEnabled: boolean
  chatbotName: string
  chatbotGreeting?: string
  chatbotLanguage?: string
  timezone: string
  currency: string
  setupCompleted: boolean
  onboardingStep: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
  tenant: Tenant
}

// ✅ Matches backend LeadResponse DTO exactly
export interface Lead {
  id: string
  firstName: string
  lastName?: string
  fullName?: string
  email?: string
  phone?: string
  whatsappNumber?: string
  nationality?: string
  currentLocation?: string

  // ── Academic ──────────────────────────────────────────
  academicPercentage?: number
  ieltsScore?: number
  hasIelts?: boolean                  // ✅ was: ieltsStatus string + separate boolean
  // NOTE: pteScore, toeflScore are NOT in LeadResponse DTO — removed
  studyLevel?: string                 // ✅ was: highestEducation

  // ── Study preferences ─────────────────────────────────
  preferredCountries?: string[]       // ✅ was: preferredCountry string
  preferredPrograms?: string[]        // ✅ was: preferredProgram string
  preferredIntake?: string

  // ── Budget ────────────────────────────────────────────
  budgetMin?: number                  // ✅ was: budget single number
  budgetMax?: number                  // ✅ new
  budgetCurrency?: string             // ✅ new

  // ── Pipeline ──────────────────────────────────────────
  source?: string
  stage: string                       // ✅ was: status
  qualificationScore?: number
  qualificationLabel?: string         // ✅ was: leadScore

  // ── Flags ─────────────────────────────────────────────
  hasPassport?: boolean               // ✅ was: passportStatus string
  visaRefusalHistory?: boolean        // ✅ new

  // ── Assignment ────────────────────────────────────────
  counselorName?: string              // ✅ was: assignedCounselor nested User object
  counselorId?: string                // ✅ new (flat UUID for dropdown pre-selection)

  // ── Timestamps & misc ─────────────────────────────────
  notes?: string
  lastContactedAt?: string
  nextFollowUpAt?: string
  createdAt: string
  updatedAt?: string
  documentCount?: number

  // ── Optional extras (not in DTO but safe to keep for future) ──
  appointmentCount?: number
}

export interface Message {
  id: string
  sender: string
  sentByUser?: User
  content: string
  contentType?: string
  mediaUrl?: string
  read: boolean
  aiConfidence?: number
  intent?: string
  createdAt: string
}

export interface Conversation {
  id: string
  channel: string
  channelIdentifier?: string
  sessionId?: string
  title?: string
  lastMessage?: string
  unreadCount: number
  open: boolean
  handoffStatus?: string
  assignedAgent?: User
  lead?: Lead
  messages?: Message[]
  language?: string
  createdAt: string
  updatedAt?: string
}

export interface Appointment {
  id: string
  leadId: string
  leadName: string
  counselor?: User
  type: string
  status: string
  startAt: string
  endAt: string
  durationMinutes: number
  title?: string
  notes?: string
  meetingLink?: string
  meetingPlatform?: string
  location?: string
  createdAt: string
}

export interface Document {
  id: string
  leadId: string
  documentType: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType?: string
  status: string
  reviewNotes?: string
  reviewedAt?: string
  downloadUrl?: string
  expiryDate?: string
  createdAt: string
}

export interface FollowUp {
  id: string
  leadId?: string
  lead?: Lead
  assignedTo?: User
  title: string
  description?: string
  status: string
  dueAt: string
  completedAt?: string
  completedNotes?: string
  priority: number
  channel?: string
  createdAt?: string
}

export interface Note {
  id: string
  content: string
  pinned: boolean
  visibility: string
  author: User
  createdAt: string
}

export interface DashboardStats {
  totalLeads: number
  newLeadsThisMonth: number
  newLeadsToday: number
  hotLeads: number
  warmLeads: number
  coldLeads: number
  upcomingAppointments: number
  pendingFollowUps: number
  overdueFollowUps: number
  openConversations: number
  pendingHandoffs: number
  totalRevenue: number
  revenueThisMonth: number
  conversionRate: number
  // ✅ was: leadsByStatus — renamed to match stage terminology
  leadsByStage: Array<{ stage: string; count: number }>
  leadsBySource: Array<{ source: string; count: number }>
  topCountries: Array<{ country: string; count: number }>
  weeklyLeads: Array<{ date: string; count: number }>
}

export interface Invoice {
  id: string
  leadId?: string
  lead?: Lead
  invoiceNumber: string
  status: string
  subtotal: number
  taxRate?: number
  taxAmount?: number
  discountAmount?: number
  total: number
  currency: string
  dueDate?: string
  paidAt?: string
  notes?: string
  lineItems?: string
  createdAt: string
}

export interface KnowledgeBase {
  id: string
  title: string
  content: string
  category?: string
  tags?: string
  sourceFileName?: string
  active: boolean
  language: string
  viewCount: number
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  readAt?: string
  actionUrl?: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  activityType: string
  description: string
  entityType?: string
  oldValue?: string
  newValue?: string
  user?: User
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}