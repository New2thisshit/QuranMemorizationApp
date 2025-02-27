import * as SQLite from 'expo-sqlite'
import * as FileSystem from 'expo-file-system'
import { Asset } from 'expo-asset'

// Define database version for migration management
const DB_VERSION = 1

// Define custom interfaces to match our usage but work with current expo-sqlite
// These interfaces match the structure of objects our code is using
interface SQLTransactionCallback {
  executeSql(
    sqlStatement: string,
    args?: any[],
    callback?: (
      transaction: SQLTransactionCallback,
      resultSet: SQLResultSetCallback,
    ) => void,
    errorCallback?: (
      transaction: SQLTransactionCallback,
      error: Error,
    ) => boolean,
  ): void
}

interface SQLResultSetCallback {
  insertId?: number
  rowsAffected: number
  rows: {
    length: number
    item: (idx: number) => any
    _array?: any[]
  }
}

interface Database {
  transaction(
    callback: (transaction: SQLTransactionCallback) => void,
    errorCallback?: (error: Error) => void,
    successCallback?: () => void,
  ): void
}

// Create or open the database
const openDatabase = (): Database => {
  // @ts-ignore - We know this returns something compatible with our Database interface
  return SQLite.openDatabase('quranmemorizer.db')
}

/**
 * Initialize the database with all necessary tables.
 * This function should be called when the app starts.
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database...')
    const db = openDatabase()

    // Check if this is the first run or if we need migrations
    await checkAndMigrateDatabase(db)

    // Set up all tables
    await setupTables(db)

    // Load initial Quran data if needed
    await loadQuranData(db)

    console.log('Database initialization complete')
    return Promise.resolve()
  } catch (error) {
    console.error('Database initialization failed:', error)
    return Promise.reject(error)
  }
}

/**
 * Check the current database version and run migrations if needed
 */
const checkAndMigrateDatabase = async (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // First, check if the version table exists
    db.transaction(
      (tx: SQLTransactionCallback) => {
        tx.executeSql(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='app_version'",
          [],
          (_: SQLTransactionCallback, result: SQLResultSetCallback) => {
            if (result.rows.length === 0) {
              // Version table doesn't exist, create it and set initial version
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS app_version (version INTEGER PRIMARY KEY)',
                [],
                () => {
                  tx.executeSql(
                    'INSERT INTO app_version (version) VALUES (?)',
                    [DB_VERSION],
                    () => {
                      console.log(
                        `Database initialized at version ${DB_VERSION}`,
                      )
                      resolve()
                    },
                    (_: SQLTransactionCallback, error: Error) => {
                      reject(error)
                      return false
                    },
                  )
                },
                (_: SQLTransactionCallback, error: Error) => {
                  reject(error)
                  return false
                },
              )
            } else {
              // Version table exists, check current version
              tx.executeSql(
                'SELECT version FROM app_version',
                [],
                (_: SQLTransactionCallback, result: SQLResultSetCallback) => {
                  const currentVersion = result.rows.item(0).version

                  if (currentVersion < DB_VERSION) {
                    // Run migrations if current version is lower than target version
                    runMigrations(db, currentVersion, DB_VERSION)
                      .then(resolve)
                      .catch(reject)
                  } else {
                    console.log(`Database already at version ${currentVersion}`)
                    resolve()
                  }
                },
                (_: SQLTransactionCallback, error: Error) => {
                  reject(error)
                  return false
                },
              )
            }
          },
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )
      },
      (error: Error) => {
        console.error('Transaction error during version check:', error)
        reject(error)
      },
    )
  })
}

/**
 * Run database migrations from current version to target version
 */
const runMigrations = async (
  db: Database,
  currentVersion: number,
  targetVersion: number,
): Promise<void> => {
  console.log(
    `Running migrations from version ${currentVersion} to ${targetVersion}`,
  )

  // Apply migrations incrementally
  for (let version = currentVersion + 1; version <= targetVersion; version++) {
    await applyMigration(db, version)
  }

  // Update database version
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLTransactionCallback) => {
        tx.executeSql(
          'UPDATE app_version SET version = ?',
          [targetVersion],
          () => {
            console.log(`Database migrated to version ${targetVersion}`)
            resolve()
          },
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )
      },
      (error: Error) => {
        console.error('Transaction error during version update:', error)
        reject(error)
      },
    )
  })
}

/**
 * Apply a specific migration version
 */
const applyMigration = async (db: Database, version: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`Applying migration for version ${version}`)

    // Define migration steps for each version
    switch (version) {
      case 1:
        // Initial schema - nothing to migrate
        resolve()
        break

      case 2:
        // Example future migration
        db.transaction(
          (tx: SQLTransactionCallback) => {
            // Add new tables or alter existing ones for version 2
            // For example: tx.executeSql('ALTER TABLE users ADD COLUMN preferences TEXT', []);
            resolve()
          },
          (error: Error) => {
            console.error(`Migration error for version ${version}:`, error)
            reject(error)
          },
        )
        break

      default:
        console.warn(`No migration defined for version ${version}`)
        resolve()
    }
  })
}

/**
 * Set up all required database tables
 */
const setupTables = async (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLTransactionCallback) => {
        // Create users table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            created_at INTEGER,
            last_login INTEGER,
            settings TEXT
          )`,
          [],
          () => {},
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )

        // Create surahs table for caching Quran data
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS surahs (
            number INTEGER PRIMARY KEY,
            name TEXT,
            english_name TEXT,
            english_name_translation TEXT,
            revelation_type TEXT,
            ayahs_count INTEGER,
            data TEXT
          )`,
          [],
          () => {},
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )

        // Create ayah_progress table to track memorization progress
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ayah_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            surah_id INTEGER,
            ayah_id INTEGER,
            status TEXT,
            last_score REAL,
            review_count INTEGER,
            date_memorized INTEGER,
            last_review INTEGER,
            UNIQUE(user_id, surah_id, ayah_id)
          )`,
          [],
          () => {},
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )

        // Create recitation_history table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS recitation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            surah_id INTEGER,
            ayah_id INTEGER,
            score REAL,
            tajweed_score REAL,
            accuracy_score REAL,
            duration INTEGER,
            recording_path TEXT,
            timestamp INTEGER,
            notes TEXT
          )`,
          [],
          () => {},
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )

        // Create user_achievements table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            achievement_id TEXT,
            earned_date INTEGER,
            data TEXT
          )`,
          [],
          () => {
            console.log('All tables created successfully')
            resolve()
          },
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )
      },
      (error: Error) => {
        console.error('Transaction error during table creation:', error)
        reject(error)
      },
    )
  })
}

/**
 * Load Quran data into the database from bundled assets
 */
const loadQuranData = async (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // First check if we already have Quran data
    db.transaction(
      (tx: SQLTransactionCallback) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM surahs',
          [],
          async (_: SQLTransactionCallback, result: SQLResultSetCallback) => {
            const count = result.rows.item(0).count

            if (count === 0) {
              console.log('No Quran data found, loading from assets...')

              try {
                // Load the Quran data from bundled assets
                const asset = Asset.fromModule(
                  require('../../assets/quran-data/quran.json'),
                )
                await asset.downloadAsync()

                if (asset.localUri) {
                  const fileContent = await FileSystem.readAsStringAsync(
                    asset.localUri,
                  )
                  const quranData = JSON.parse(fileContent)

                  // Insert surah data
                  await insertSurahs(db, quranData.surahs)
                  console.log('Quran data loaded successfully')
                }

                resolve()
              } catch (error) {
                console.error('Error loading Quran data:', error)
                reject(error)
              }
            } else {
              console.log(`Quran data already loaded (${count} surahs)`)
              resolve()
            }
          },
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )
      },
      (error: Error) => {
        console.error('Transaction error during Quran data check:', error)
        reject(error)
      },
    )
  })
}

/**
 * Insert surah data into the database
 */
const insertSurahs = async (db: Database, surahs: any[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLTransactionCallback) => {
        surahs.forEach((surah) => {
          tx.executeSql(
            `INSERT INTO surahs (
              number, name, english_name, english_name_translation, 
              revelation_type, ayahs_count, data
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              surah.number,
              surah.name,
              surah.englishName,
              surah.englishNameTranslation,
              surah.revelationType,
              surah.ayahs.length,
              JSON.stringify(surah.ayahs),
            ],
            () => {},
            (_: SQLTransactionCallback, error: Error) => {
              console.error(`Error inserting surah ${surah.number}:`, error)
              return false
            },
          )
        })

        resolve()
      },
      (error: Error) => {
        console.error('Transaction error during surah insertion:', error)
        reject(error)
      },
      () => {
        console.log(`Inserted ${surahs.length} surahs into the database`)
        resolve()
      },
    )
  })
}

/**
 * Helper function to execute a SQL query
 */
export const executeQuery = async (
  query: string,
  params: any[] = [],
): Promise<SQLResultSetCallback> => {
  const db = openDatabase()

  return new Promise<SQLResultSetCallback>((resolve, reject) => {
    db.transaction(
      (tx: SQLTransactionCallback) => {
        tx.executeSql(
          query,
          params,
          (_: SQLTransactionCallback, result: SQLResultSetCallback) => {
            resolve(result)
          },
          (_: SQLTransactionCallback, error: Error) => {
            reject(error)
            return false
          },
        )
      },
      (error: Error) => {
        console.error('Transaction error during query execution:', error)
        reject(error)
      },
    )
  })
}

/**
 * Get user's progress for memorization
 */
export const getUserProgress = async (userId: string): Promise<any> => {
  try {
    // Get overall statistics
    const overallStats = await executeQuery(
      `SELECT 
        COUNT(DISTINCT surah_id) as surahs_started,
        COUNT(CASE WHEN status = 'memorized' THEN 1 END) as ayahs_memorized,
        COUNT(*) as total_ayahs_started,
        AVG(last_score) as average_score
      FROM ayah_progress
      WHERE user_id = ?`,
      [userId],
    )

    // Get surah progress
    const surahProgress = await executeQuery(
      `SELECT 
        ap.surah_id,
        s.english_name as surah_name,
        COUNT(ap.id) as ayahs_started,
        COUNT(CASE WHEN ap.status = 'memorized' THEN 1 END) as ayahs_memorized,
        s.ayahs_count as total_ayahs,
        MAX(ap.last_review) as last_review,
        AVG(ap.last_score) as average_score
      FROM ayah_progress ap
      JOIN surahs s ON ap.surah_id = s.number
      WHERE ap.user_id = ?
      GROUP BY ap.surah_id
      ORDER BY ap.surah_id`,
      [userId],
    )

    // Get recent activity
    const recentActivity = await executeQuery(
      `SELECT 
        date(timestamp/1000, 'unixepoch') as date,
        COUNT(*) as ayahs_reviewed,
        AVG(score) as average_score
      FROM recitation_history
      WHERE user_id = ?
      GROUP BY date(timestamp/1000, 'unixepoch')
      ORDER BY date DESC
      LIMIT 30`,
      [userId],
    )

    // Format the data
    const stats = overallStats.rows.item(0)

    const formattedSurahProgress = []
    for (let i = 0; i < surahProgress.rows.length; i++) {
      const surah = surahProgress.rows.item(i)
      formattedSurahProgress.push({
        surahId: surah.surah_id,
        surahName: surah.surah_name,
        ayahsStarted: surah.ayahs_started,
        ayahsMemorized: surah.ayahs_memorized,
        totalAyahs: surah.total_ayahs,
        completionPercentage: (surah.ayahs_memorized / surah.total_ayahs) * 100,
        lastReview: surah.last_review
          ? new Date(surah.last_review).toISOString()
          : null,
        averageScore: surah.average_score,
      })
    }

    const formattedActivity = []
    for (let i = 0; i < recentActivity.rows.length; i++) {
      const activity = recentActivity.rows.item(i)
      formattedActivity.push({
        date: activity.date,
        ayahsReviewed: activity.ayahs_reviewed,
        averageScore: activity.average_score,
      })
    }

    return {
      totalAyahsMemorized: stats.ayahs_memorized || 0,
      totalAyahsStarted: stats.total_ayahs_started || 0,
      surahsStarted: stats.surahs_started || 0,
      averageScore: stats.average_score || 0,
      memorizedSurahs: formattedSurahProgress,
      recentActivity: formattedActivity,
    }
  } catch (error) {
    console.error('Error getting user progress:', error)
    throw error
  }
}

/**
 * Save recitation progress for an ayah
 */
export const saveRecitationProgress = async (
  userId: string,
  surahId: number,
  ayahId: number,
  score: number,
  duration: number,
  recordingPath?: string,
  notes?: string,
): Promise<void> => {
  try {
    const timestamp = Date.now()

    // First save to recitation history
    await executeQuery(
      `INSERT INTO recitation_history (
        user_id, surah_id, ayah_id, score, duration, 
        recording_path, timestamp, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        surahId,
        ayahId,
        score,
        duration,
        recordingPath || null,
        timestamp,
        notes || null,
      ],
    )

    // Then update ayah progress
    const currentProgress = await executeQuery(
      'SELECT * FROM ayah_progress WHERE user_id = ? AND surah_id = ? AND ayah_id = ?',
      [userId, surahId, ayahId],
    )

    // Determine status based on score
    let status = 'learning'
    if (score >= 90) {
      status = 'memorized'
    } else if (score >= 70) {
      status = 'reviewing'
    }

    const dateMemorized = status === 'memorized' ? timestamp : null

    if (currentProgress.rows.length === 0) {
      // First time recording this ayah
      await executeQuery(
        `INSERT INTO ayah_progress (
          user_id, surah_id, ayah_id, status, last_score,
          review_count, date_memorized, last_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, surahId, ayahId, status, score, 1, dateMemorized, timestamp],
      )
    } else {
      // Update existing progress
      const progress = currentProgress.rows.item(0)
      const reviewCount = progress.review_count + 1

      // Only update date_memorized if it's not already set and status is now 'memorized'
      const newDateMemorized = progress.date_memorized || dateMemorized

      await executeQuery(
        `UPDATE ayah_progress SET
          status = ?,
          last_score = ?,
          review_count = ?,
          date_memorized = ?,
          last_review = ?
        WHERE user_id = ? AND surah_id = ? AND ayah_id = ?`,
        [
          status,
          score,
          reviewCount,
          newDateMemorized,
          timestamp,
          userId,
          surahId,
          ayahId,
        ],
      )
    }

    console.log(
      `Saved recitation progress for surah ${surahId}, ayah ${ayahId}`,
    )
  } catch (error) {
    console.error('Error saving recitation progress:', error)
    throw error
  }
}

/**
 * Get all surahs from the database
 */
export const getAllSurahs = async (): Promise<any[]> => {
  try {
    const result = await executeQuery('SELECT * FROM surahs ORDER BY number')

    const surahs = []
    for (let i = 0; i < result.rows.length; i++) {
      const surah = result.rows.item(i)
      surahs.push({
        number: surah.number,
        name: surah.name,
        englishName: surah.english_name,
        englishNameTranslation: surah.english_name_translation,
        revelationType: surah.revelation_type,
        numberOfAyahs: surah.ayahs_count,
        ayahs: JSON.parse(surah.data),
      })
    }

    return surahs
  } catch (error) {
    console.error('Error getting all surahs:', error)
    throw error
  }
}

/**
 * Get a specific surah by number
 */
export const getSurah = async (surahNumber: number): Promise<any> => {
  try {
    const result = await executeQuery('SELECT * FROM surahs WHERE number = ?', [
      surahNumber,
    ])

    if (result.rows.length === 0) {
      throw new Error(`Surah ${surahNumber} not found`)
    }

    const surah = result.rows.item(0)
    return {
      number: surah.number,
      name: surah.name,
      englishName: surah.english_name,
      englishNameTranslation: surah.english_name_translation,
      revelationType: surah.revelation_type,
      numberOfAyahs: surah.ayahs_count,
      ayahs: JSON.parse(surah.data),
    }
  } catch (error) {
    console.error(`Error getting surah ${surahNumber}:`, error)
    throw error
  }
}

/**
 * Save or update user settings
 */
export const saveUserSettings = async (
  userId: string,
  settings: Record<string, any>,
): Promise<void> => {
  try {
    const settingsJson = JSON.stringify(settings)

    const userExists = await executeQuery('SELECT id FROM users WHERE id = ?', [
      userId,
    ])

    if (userExists.rows.length === 0) {
      // Create user if not exists
      await executeQuery(
        'INSERT INTO users (id, settings, created_at) VALUES (?, ?, ?)',
        [userId, settingsJson, Date.now()],
      )
    } else {
      // Update existing user
      await executeQuery('UPDATE users SET settings = ? WHERE id = ?', [
        settingsJson,
        userId,
      ])
    }

    console.log(`Saved settings for user ${userId}`)
  } catch (error) {
    console.error('Error saving user settings:', error)
    throw error
  }
}

/**
 * Get user settings
 */
export const getUserSettings = async (
  userId: string,
): Promise<Record<string, any>> => {
  try {
    const result = await executeQuery(
      'SELECT settings FROM users WHERE id = ?',
      [userId],
    )

    if (result.rows.length === 0) {
      // Return default settings if user not found
      return {
        showTranslation: true,
        showTransliteration: false,
        arabicFontSize: 24,
        preferredReciter: 'Mishary Rashid Alafasy',
        autoPlayRecitation: true,
        dailyReminderTime: '18:00',
        notificationsEnabled: true,
      }
    }

    const settings = result.rows.item(0).settings
    return settings ? JSON.parse(settings) : {}
  } catch (error) {
    console.error(`Error getting settings for user ${userId}:`, error)
    throw error
  }
}

/**
 * Clear the entire database (useful for debugging or testing)
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    const db = openDatabase()

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx: SQLTransactionCallback) => {
          // Drop all tables
          tx.executeSql('DROP TABLE IF EXISTS app_version', [])
          tx.executeSql('DROP TABLE IF EXISTS users', [])
          tx.executeSql('DROP TABLE IF EXISTS surahs', [])
          tx.executeSql('DROP TABLE IF EXISTS ayah_progress', [])
          tx.executeSql('DROP TABLE IF EXISTS recitation_history', [])
          tx.executeSql('DROP TABLE IF EXISTS user_achievements', [])

          console.log('Database cleared successfully')
          resolve()
        },
        (error: Error) => {
          console.error('Transaction error during database clearing:', error)
          reject(error)
        },
      )
    })
  } catch (error) {
    console.error('Error clearing database:', error)
    throw error
  }
}
