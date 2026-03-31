// @ts-nocheck - Drizzle ORM type compatibility
import { sqliteTable, text, integer, real, json, timestamp } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const players = sqliteTable('players', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  position: text('position'),
  age: integer('age'),
  state: text('state'),
  city: text('city'),
  zipCode: text('zip_code'),
  school: text('school'),
  gradYear: integer('grad_year'),
  g5Rating: integer('g5_rating'), // 1-5 stars
  nilPoints: integer('nil_points').default(0),
  xpPoints: integer('xp_points').default(0), // Progression points
  level: integer('level').default(1),
  archetype: text('archetype'),
  gpa: text('gpa'),
  collegeOffers: text('college_offers', { mode: 'json' }),
  verificationStatus: text('verification_status').default('unverified'),
  subscriptionTier: text('subscription_tier').default('free'),
  privacySetting: text('privacy_setting').default('public'),
  segment: text('segment').default('high_school'), // youth, high_school, college, elite
  skillTier: text('skill_tier').default('beginner'), // beginner, intermediate, advanced, elite
  isRecreational: integer('is_recreational', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  state: text('state'),
  city: text('city'),
  conference: text('conference'),
  division: text('division'), // NAIA, NJCAA, NCAA D1, etc.
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  titles: integer('titles').default(0),
  rating: integer('rating').default(0),
  tuitionInState: integer('tuition_in_state'),
  tuitionOutState: integer('tuition_out_state'),
  hasApplication: integer('has_application', { mode: 'boolean' }).default(false),
  hasQuestionnaire: integer('has_questionnaire', { mode: 'boolean' }).default(false),
  applicationUrl: text('application_url'),
  questionnaireUrl: text('questionnaire_url'),
  socials: text('socials', { mode: 'json' }), // { instagram, twitter, facebook, youtube }
  type: text('type').default('college'), // college, high_school
});

export const combineStats = sqliteTable('combine_stats', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  season: text('season'),
  fortyDash: text('forty_dash'),
  shuttle: text('shuttle'),
  vertical: text('vertical'),
  broadJump: text('broad_jump'),
  threeCone: text('three_cone'),
});

export const gameStats = sqliteTable('game_stats', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  gameId: integer('game_id'),
  passingAttempts: integer('passing_attempts'),
  passingCompletions: integer('passing_completions'),
  passingYards: integer('passing_yards'),
  passingTds: integer('passing_tds'),
  interceptionsThrown: integer('interceptions_thrown'),
  longestPass: integer('longest_pass'),
  rushingAttempts: integer('rushing_attempts'),
  rushingYards: integer('rushing_yards'),
  rushingTds: integer('rushing_tds'),
  longestRun: integer('longest_run'),
  receptions: integer('receptions'),
  receivingYards: integer('receiving_yards'),
  receivingTds: integer('receiving_tds'),
  longestReception: integer('longest_reception'),
  flagPulls: integer('flag_pulls'),
  interceptionsCaught: integer('interceptions_caught'),
  passBreakups: integer('pass_breakups'),
  defensiveTds: integer('defensive_tds'),
});

export const badges = sqliteTable('badges', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  category: text('category'),
});

export const playerBadges = sqliteTable('player_badges', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  badgeId: integer('badge_id').references(() => badges.id),
  earnedAt: integer('earned_at', { mode: 'timestamp' }).defaultNow(),
});

export const challenges = sqliteTable('challenges', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  points: integer('points'),
  type: text('type'),
});

export const playerChallenges = sqliteTable('player_challenges', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  challengeId: integer('challenge_id').references(() => challenges.id),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  content: text('content'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  category: text('category'), // training, game, combine
  moderationStatus: text('moderation_status').default('pending'), // pending, approved, flagged
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const stories = sqliteTable('stories', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  imageUrl: text('image_url'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const nilActivities = sqliteTable('nil_activities', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  activityType: text('activity_type'),
  pointsEarned: integer('points_earned'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const nilOpportunities = sqliteTable('nil_opportunities', {
  id: integer('id').primaryKey(),
  brandName: text('brand_name'),
  requirements: text('requirements'),
  deliverables: text('deliverables'),
  estimatedEarnings: integer('estimated_earnings'),
});

export const dealApplications = sqliteTable('deal_applications', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  opportunityId: integer('opportunity_id').references(() => nilOpportunities.id),
  status: text('status'),
  aiMatchScore: integer('ai_match_score'),
});

export const dealTasks = sqliteTable('deal_tasks', {
  id: integer('id').primaryKey(),
  applicationId: integer('application_id').references(() => dealApplications.id),
  taskDescription: text('task_description'),
  completed: boolean('completed').default(false),
});

export const earningsTracking = sqliteTable('earnings_tracking', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  applicationId: integer('application_id').references(() => dealApplications.id),
  amount: integer('amount'),
  status: text('status'),
});

export const teamNilCampaigns = sqliteTable('team_nil_campaigns', {
  id: integer('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  campaignName: text('campaign_name'),
  totalPool: integer('total_pool'),
});

export const mentorshipConnections = sqliteTable('mentorship_connections', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  mentorName: text('mentor_name'),
  matchedAt: integer('matched_at', { mode: 'timestamp' }).defaultNow(),
});

export const playerHighlights = sqliteTable('player_highlights', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  category: text('category'),
  season: text('season'),
  annotations: text('annotations', { mode: 'json' }).default([]),
  clipSettings: text('clip_settings', { mode: 'json' }), // { start, end, originalVideoId }
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Parents table - for parent accounts who can manage their children's profiles and payments
export const parents = sqliteTable('parents', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Link between parents and their children (athletes)
export const parentChildRelations = sqliteTable('parent_child_relations', {
  id: integer('id').primaryKey(),
  parentId: integer('parent_id').references(() => parents.id),
  playerId: integer('player_id').references(() => players.id),
  relationship: text('relationship'), // 'mother', 'father', 'guardian', etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const coaches = sqliteTable('coaches', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  university: text('university'),
  division: text('division'),
  recruitingPositions: text('recruiting_positions', { mode: 'json' }),
  recruitingStates: text('recruiting_states', { mode: 'json' }),
  verifiedStatus: boolean('verified_status').default(false),
});

export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role'),
});

export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: integer('id').primaryKey(),
  name: text('name'),
  price: integer('price'), // in cents
  tierLevel: text('tier_level'),
});

export const playerSubscriptions = sqliteTable('player_subscriptions', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  planId: integer('plan_id').references(() => subscriptionPlans.id),
  status: text('status'),
  stripeSubscriptionId: text('stripe_subscription_id'),
});

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  opponentName: text('opponent_name'),
  date: timestamp('date'),
  result: text('result'),
});

export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey(),
  followerId: integer('follower_id').references(() => players.id),
  followingId: integer('following_id').references(() => players.id),
});

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey(),
  postId: integer('post_id').references(() => posts.id),
  playerId: integer('player_id').references(() => players.id),
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  type: text('type'), // like, comment, follow, mention, coach_interest
  actorName: text('actor_name'),
  read: boolean('read').default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const aiBots = sqliteTable('ai_bots', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  botName: text('bot_name'),
  personality: text('personality'),
  interactionCount: integer('interaction_count').default(0),
});

export const botConversations = sqliteTable('bot_conversations', {
  id: integer('id').primaryKey(),
  botId: integer('bot_id').references(() => aiBots.id),
  role: text('role'), // 'user' | 'assistant'
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const trainingPlans = sqliteTable('training_plans', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  weeklySchedule: json('weekly_schedule'),
  goals: text('goals'),
});

export const drills = sqliteTable('drills', {
  id: integer('id').primaryKey(),
  position: text('position'),
  category: text('category'),
  instructions: text('instructions'),
});

export const skillChallengeCompletions = sqliteTable('skill_challenge_completions', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  drillId: integer('drill_id').references(() => drills.id),
  aiFeedback: text('ai_feedback'),
  score: integer('score'),
});

export const coachFeedback = sqliteTable('coach_feedback', {
  id: integer('id').primaryKey(),
  coachId: integer('coach_id').references(() => coaches.id),
  playerId: integer('player_id').references(() => players.id),
  skillRatings: json('skill_ratings'),
  notes: text('notes'),
});

export const events = sqliteTable('events', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  location: text('location').notNull(),
  registrationDeadline: timestamp('registration_deadline'),
  participantCount: integer('participant_count').default(0),
  capacity: integer('capacity').default(0),
  price: integer('price').default(0), // in cents
  description: text('description'),
  upcoming: boolean('upcoming').default(true),
});

export const eventRegistrations = sqliteTable('event_registrations', {
  id: integer('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id),
  playerId: integer('player_id').references(() => players.id),
  checkedIn: boolean('checked_in').default(false),
});

export const eventLeaderboards = sqliteTable('event_leaderboards', {
  id: integer('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id),
  playerId: integer('player_id').references(() => players.id),
  rank: integer('rank'),
  performanceMetrics: json('performance_metrics'),
});

export const brandPartnerships = sqliteTable('brand_partnerships', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  opportunityId: integer('opportunity_id').references(() => nilOpportunities.id),
  status: text('status'), // active, completed
});

// ----------------------
// PAYMENTS - Track kid payments
// ----------------------
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').default('usd'),
  status: text('status').default('pending'), // pending, completed, failed, refunded
  paymentMethod: text('payment_method'), // card, paypal, stripe, cash, check
  paymentType: text('payment_type'), // subscription, one_time, tournament_fee, equipment, training
  description: text('description'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCustomerId: text('stripe_customer_id'),
  receiptUrl: text('receipt_url'),
  parentName: text('parent_name'),
  parentEmail: text('parent_email'),
  parentPhone: text('parent_phone'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').defaultNow(),
  paidAt: timestamp('paid_at'),
});

export const paymentMethods = sqliteTable('payment_methods', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  type: text('type').notNull(), // card, paypal, bank_account
  last4: text('last4'),
  brand: text('brand'), // visa, mastercard, etc.
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  stripePaymentMethodId: text('stripe_payment_method_id'),
  isDefault: boolean('is_default').default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  invoiceNumber: text('invoice_number').notNull(),
  amount: integer('amount').notNull(),
  tax: integer('tax').default(0),
  total: integer('total').notNull(),
  status: text('status').default('draft'), // draft, sent, paid, void
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  description: text('description'),
  lineItems: json('line_items'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
export const messageRequests = sqliteTable('message_requests', {
  id: integer('id').primaryKey(),
  athleteId: integer('athlete_id').references(() => players.id),
  receiverId: integer('receiver_id'), // Coach or College ID
  content: text('content').notNull(),
  status: text('status').default('pending'), // pending, approved, rejected, sent
  parentId: integer('parent_id').references(() => parents.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const athleteRankings = sqliteTable('athlete_rankings', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id).unique(),
  nationalRank: integer('national_rank'),
  stateRank: integer('state_rank'),
  positionRank: integer('position_rank'),
  percentile: integer('percentile'),
  movement: text('movement'), // up, down, same
  // Overall scores
  overallScore: real('overall_score'),
  // Individual source scores
  combineScore: real('combine_score'),
  maxPrepsScore: real('max_preps_score'),
  zybekScore: real('zybek_score'),
  usaTalentIdScore: real('usa_talent_id_score'),
  // Data source tracking
  dataSources: json('data_sources').default([]),
  // Last update from each source
  maxPrepsLastUpdate: timestamp('max_preps_last_update'),
  zybekLastUpdate: timestamp('zybek_last_update'),
  usaTalentIdLastUpdate: timestamp('usa_talent_id_last_update'),
  combineLastUpdate: timestamp('combine_last_update'),
  // Verification status
  maxPrepsVerified: boolean('max_preps_verified').default(false),
  zybekVerified: boolean('zybek_verified').default(false),
  usaTalentIdVerified: boolean('usa_talent_id_verified').default(false),
  combineVerified: boolean('combine_verified').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const coachProspects = sqliteTable('coach_prospects', {
  id: integer('id').primaryKey(),
  coachId: integer('coach_id').references(() => coaches.id),
  athleteId: integer('athlete_id').references(() => players.id),
  tier: text('tier').default('watching'), // target, watching, offered
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const scholarships = sqliteTable('scholarships', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  amount: integer('amount').notNull(),
  deadline: timestamp('deadline').notNull(),
  requirements: text('requirements'),
  category: text('category'),
  eligibleStates: json('eligible_states').default(['ALL']),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const savedScholarships = sqliteTable('saved_scholarships', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  scholarshipId: integer('scholarship_id').references(() => scholarships.id),
  savedAt: timestamp('saved_at').defaultNow(),
});
export const faqs = sqliteTable('faqs', {
  id: integer('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').default('General'),
  isPublic: boolean('is_public').default(true),
  askedCount: integer('asked_count').default(1),
  lastAskedAt: timestamp('last_asked_at').defaultNow(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const supportInteractions = sqliteTable('support_interactions', {
  id: integer('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  question: text('question').notNull(),
  aiResponse: text('ai_response').notNull(),
  wasHelpful: boolean('was_helpful').default(true),
  tags: json('tags'), // Array of keywords
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

