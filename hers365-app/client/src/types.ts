// Platform types
export type Platform = 'web' | 'ios' | 'android';

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'athlete' | 'parent' | 'coach' | 'admin';
  position?: string;
  state?: string;
  school?: string;
  gradYear?: number;
  token?: string;
}

export interface AthleteProfile {
  id: number;
  name: string;
  position: string;
  state: string;
  city: string;
  zipCode: string;
  g5Rating: number;
  nilPoints: number;
  xpPoints: number;
  level: number;
  archetype: string;
  gpa: string;
  collegeOffers: string[];
  verificationStatus: string;
  subscriptionTier: string;
  privacySetting: string;
  segment: string;
  skillTier: string;
  isRecreational: boolean;
  createdAt: Date;
}

// Coach types
export interface Coach {
  id: number;
  name: string;
  university: string;
  division: string;
  recruitingPositions: string[];
  recruitingStates: string[];
  verifiedStatus: boolean;
}

// Parent types
export interface Parent {
  id: number;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
}

// Post types
export interface Post {
  id: number;
  playerId: number;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  category: string;
  moderationStatus: string;
  likes: number;
  comments: number;
  createdAt: Date;
}

// Message types
export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  pending?: boolean;
  approved?: boolean;
  createdAt: Date;
}

// Notification types
export interface Notification {
  id: number;
  playerId: number;
  type: string;
  actorName: string;
  read: boolean;
  createdAt: Date;
}

// Event types
export interface Event {
  id: number;
  name: string;
  date: Date;
  location: string;
  registrationDeadline?: Date;
  participantCount: number;
}

// NIL Opportunity types
export interface NilOpportunity {
  id: number;
  brandName: string;
  requirements: string;
  deliverables: string;
  estimatedEarnings: number;
}

// Badge types
export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
}

// Game Stats types
export interface GameStats {
  id: number;
  playerId: number;
  gameId: number;
  passingAttempts?: number;
  passingCompletions?: number;
  passingYards?: number;
  passingTds?: number;
  interceptionsThrown?: number;
  longestPass?: number;
  rushingAttempts?: number;
  rushingYards?: number;
  rushingTds?: number;
  longestRun?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTds?: number;
  longestReception?: number;
  flagPulls?: number;
  interceptionsCaught?: number;
  passBreakups?: number;
  defensiveTds?: number;
}

// Combine Stats types
export interface CombineStats {
  id: number;
  playerId: number;
  season: string;
  fortyDash?: string;
  shuttle?: string;
  vertical?: string;
  broadJump?: string;
  threeCone?: string;
}

// Payment types
export interface Payment {
  id: number;
  playerId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentType?: string;
  description?: string;
  parentName?: string;
  parentEmail?: string;
  createdAt: Date;
  paidAt?: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
