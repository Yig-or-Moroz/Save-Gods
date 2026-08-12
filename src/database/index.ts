import * as SQLite from 'expo-sqlite';
import {
	CHARACTER_NAMES,
	ABILITY_CARDS,
	GOODS,
	EVENT_CARDS,
	EXPERIENCE_CARDS,
} from './staticData';

// Відкриваємо базу даних синхронно (новий API)
const db = SQLite.openDatabaseSync('savegods.db');

// Головна функція ініціалізації (асинхронна)
export const initDatabase = async (): Promise<void> => {
	try {
		// =====================================================
		// 1. СТВОРЕННЯ СТАТИЧНИХ ТАБЛИЦЬ
		// =====================================================

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS character_names (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ability_cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS goods (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS event_cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        property_constantly TEXT
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS experience_cards (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        character_name_id INTEGER,
        FOREIGN KEY (character_name_id) REFERENCES character_names(id) ON DELETE CASCADE
      );
    `);

		// =====================================================
		// 2. СТВОРЕННЯ ЗМІННИХ ТАБЛИЦЬ
		// =====================================================

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_name TEXT,
        game_date TEXT,
        number_of_players INTEGER,
        difficulty_level INTEGER,
        number_of_losses INTEGER DEFAULT 0,
        experience INTEGER DEFAULT 0,
        win INTEGER DEFAULT 0
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        name TEXT,
        team_tokens INTEGER DEFAULT 0,
        ability_card_id_1 INTEGER,
        ability_card_id_2 INTEGER,
        ability_card_id_3 INTEGER,
        captain INTEGER DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (ability_card_id_1) REFERENCES ability_cards(id),
        FOREIGN KEY (ability_card_id_2) REFERENCES ability_cards(id),
        FOREIGN KEY (ability_card_id_3) REFERENCES ability_cards(id)
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        player_id INTEGER,
        character_name_id INTEGER,
        damage INTEGER DEFAULT 0,
        fatigue INTEGER DEFAULT 0,
        fright INTEGER DEFAULT 0,
        madness INTEGER DEFAULT 0,
        poisoning INTEGER DEFAULT 0,
        weakness INTEGER DEFAULT 0,
        low_morale INTEGER DEFAULT 0,
        experience_card_id_1 INTEGER,
        experience_card_id_2 INTEGER,
        experience_card_id_3 INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (character_name_id) REFERENCES character_names(id),
        FOREIGN KEY (experience_card_id_1) REFERENCES experience_cards(id),
        FOREIGN KEY (experience_card_id_2) REFERENCES experience_cards(id),
        FOREIGN KEY (experience_card_id_3) REFERENCES experience_cards(id)
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        hull INTEGER,
        deck INTEGER,
        hospital INTEGER,
        caboose INTEGER,
        cabin INTEGER,
        bridge INTEGER,
        last_action TEXT,
        page INTEGER,
        location TEXT,
        meat INTEGER,
        vegetables INTEGER,
        grain INTEGER,
        materials INTEGER,
        artifacts INTEGER,
        coins INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chest_goods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        goods_id INTEGER,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (goods_id) REFERENCES goods(id)
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS event_decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        event_card_id INTEGER,
        remains_in_game INTEGER DEFAULT 1,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (event_card_id) REFERENCES event_cards(id)
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS task_decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        card_number INTEGER,
        done INTEGER DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
    `);

		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS adventure_decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        card_number INTEGER,
        totem TEXT,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );
    `);

		// =====================================================
		// 3. ЗАПОВНЕННЯ СТАТИЧНИХ ДАНИХ (якщо таблиці порожні)
		// =====================================================

		// Перевіряємо й заповнюємо character_names
		const charNamesResult = await db.getAllAsync<{ count: number }>(
			'SELECT COUNT(*) as count FROM character_names;'
		);
		if (charNamesResult[0].count === 0) {
			for (const item of CHARACTER_NAMES) {
				await db.runAsync('INSERT INTO character_names (id, name) VALUES (?, ?);', [
					item.id,
					item.name,
				]);
			}
		}

		// Перевіряємо й заповнюємо ability_cards
		const abilityResult = await db.getAllAsync<{ count: number }>(
			'SELECT COUNT(*) as count FROM ability_cards;'
		);
		if (abilityResult[0].count === 0) {
			for (const item of ABILITY_CARDS) {
				await db.runAsync('INSERT INTO ability_cards (id, name) VALUES (?, ?);', [
					item.id,
					item.name,
				]);
			}
		}

		// Перевіряємо й заповнюємо goods
		const goodsResult = await db.getAllAsync<{ count: number }>(
			'SELECT COUNT(*) as count FROM goods;'
		);
		if (goodsResult[0].count === 0) {
			for (const item of GOODS) {
				await db.runAsync('INSERT INTO goods (id, name, type) VALUES (?, ?, ?);', [
					item.id,
					item.name,
					item.type,
				]);
			}
		}

		// Перевіряємо й заповнюємо event_cards
		const eventResult = await db.getAllAsync<{ count: number }>(
			'SELECT COUNT(*) as count FROM event_cards;'
		);
		if (eventResult[0].count === 0) {
			for (const item of EVENT_CARDS) {
				await db.runAsync(
					'INSERT INTO event_cards (id, name, type, property_constantly) VALUES (?, ?, ?, ?);',
					[item.id, item.name, item.type, item.property_constantly]
				);
			}
		}

		// Перевіряємо й заповнюємо experience_cards
		const expResult = await db.getAllAsync<{ count: number }>(
			'SELECT COUNT(*) as count FROM experience_cards;'
		);
		if (expResult[0].count === 0) {
			for (const item of EXPERIENCE_CARDS) {
				await db.runAsync(
					'INSERT INTO experience_cards (id, name, character_name_id) VALUES (?, ?, ?);',
					[item.id, item.name, item.character_name_id]
				);
			}
		}

		console.log('✅ База даних ініціалізована');
	} catch (error) {
		console.error('❌ Помилка ініціалізації БД:', error);
		throw error;
	}
};

// Експортуємо db для використання в інших місцях
export { db };