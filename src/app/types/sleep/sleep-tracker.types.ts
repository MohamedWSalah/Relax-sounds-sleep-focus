/**
 * Daily listening data indexed by date string.
 */
export interface DailyListeningData {
  [date: string]: number; // seconds listened on that date
}

/**
 * Complete listening storage data structure.
 */
export interface ListeningStorageData {
  dailyData: DailyListeningData;
  allTimeTotal: number; // total seconds listened across all time
}

