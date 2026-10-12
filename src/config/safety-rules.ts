import dotenv from 'dotenv'

dotenv.config()

export interface SafetyConfiguration {
  maxDailyConnections: number
  maxDailyMessages: number
  minDelaySeconds: number
  maxDelaySeconds: number
  typingSpeedMinMs: number
  typingSpeedMaxMs: number
  workingHoursStart: number
  workingHoursEnd: number
  safeMode: boolean
  stealthUserAgent: string
  viewport: { width: number; height: number }
}

export const DEFAULT_SAFETY_CONFIG: SafetyConfiguration = {
  // Conservative daily limits to stay under LinkedIn radar
  maxDailyConnections: parseInt(process.env.MAX_DAILY_CONNECTIONS || '15', 10),
  maxDailyMessages: parseInt(process.env.MAX_DAILY_MESSAGES || '25', 10),

  // Delay ranges between subsequent profile actions
  minDelaySeconds: parseInt(process.env.MIN_DELAY_SECONDS || '45', 10),
  maxDelaySeconds: parseInt(process.env.MAX_DELAY_SECONDS || '130', 10),

  // Keystroke delays for natural typing
  typingSpeedMinMs: parseInt(process.env.TYPING_SPEED_MIN_MS || '50', 10),
  typingSpeedMaxMs: parseInt(process.env.TYPING_SPEED_MAX_MS || '180', 10),

  // Working window (e.g., 9 AM to 7 PM)
  workingHoursStart: parseInt(process.env.WORKING_HOURS_START || '9', 10),
  workingHoursEnd: parseInt(process.env.WORKING_HOURS_END || '19', 10),

  safeMode: true,

  // Realistic modern Windows Chrome User-Agent
  stealthUserAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',

  viewport: {
    width: 1366,
    height: 768,
  },
}
