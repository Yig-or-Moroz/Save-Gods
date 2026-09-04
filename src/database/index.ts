// src/database/index.ts

import * as SQLite from 'expo-sqlite';

import { CharacterName } from '../models/types';

import {
	CHARACTER_NAMES,
	ABILITY_CARDS,
	GOODS,
	EVENT_CARDS,
	EXPERIENCE_CARDS,
} from './staticData';

const DATABASE_NAME = 'savegods.db';
const DATABASE_VERSION = 3;

export const db = SQLite.openDatabaseSync(DATABASE_NAME);

/**
 * Ініціалізація бази даних.
 */
export function initDatabase(): void {
	db.execSync(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

	const currentVersion =
		db.getFirstSync<{ user_version: number }>(
			'PRAGMA user_version;'
		)?.user_version ?? 0;

	if (currentVersion !== DATABASE_VERSION) {
		resetDatabase();

		db.execSync(
			`PRAGMA user_version = ${DATABASE_VERSION};`
		);
	}

	seedStaticData();
}

/**
 * Повністю пересоздає схему БД.
 *
 * Використовується зараз навмисно, оскільки при зміні версії
 * старі збереження можна видалити.
 */
function resetDatabase(): void {
	db.execSync(`
    PRAGMA foreign_keys = OFF;

    DROP TABLE IF EXISTS adventure_decks;
    DROP TABLE IF EXISTS task_decks;
    DROP TABLE IF EXISTS event_decks;
    DROP TABLE IF EXISTS chest_goods;
    DROP TABLE IF EXISTS ships;
    DROP TABLE IF EXISTS characters;
    DROP TABLE IF EXISTS players;
    DROP TABLE IF EXISTS games;

    DROP TABLE IF EXISTS experience_cards;
    DROP TABLE IF EXISTS event_cards;
    DROP TABLE IF EXISTS goods;
    DROP TABLE IF EXISTS ability_cards;
    DROP TABLE IF EXISTS character_names;

    PRAGMA foreign_keys = ON;
  `);

	createSchema();
}

/**
 * Створення всіх таблиць.
 */
function createSchema(): void {
	db.execSync(`
    PRAGMA foreign_keys = ON;

    /* =========================================================
       STATIC DATA
       ========================================================= */

    CREATE TABLE IF NOT EXISTS character_names (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS ability_cards (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS goods (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_cards (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      property_constantly INTEGER NOT NULL DEFAULT 0
        CHECK (property_constantly IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS experience_cards (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      character_name_id INTEGER NOT NULL,

      FOREIGN KEY (character_name_id)
        REFERENCES character_names(id)
        ON DELETE CASCADE,

      UNIQUE (character_name_id, name)
    );

    /* =========================================================
       GAMES
       ========================================================= */

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_name TEXT NOT NULL
        CHECK (length(trim(game_name)) > 0),

      game_date TEXT NOT NULL,

      number_of_players INTEGER NOT NULL
        CHECK (number_of_players BETWEEN 1 AND 4),

      difficulty_level INTEGER NOT NULL
        CHECK (difficulty_level IN (1, 2)),

      number_of_losses INTEGER NOT NULL DEFAULT 0
        CHECK (number_of_losses >= 0),

      experience INTEGER NOT NULL DEFAULT 0
        CHECK (experience >= 0),

      win INTEGER NOT NULL DEFAULT 0
        CHECK (win IN (0, 1)),

      current_player_id INTEGER NULL,

      /*
       * current_player_id повинен належати саме цій грі.
       *
       * Це composite FK:
       *   players.id
       *   players.game_id
       */
      FOREIGN KEY (current_player_id, id)
        REFERENCES players(id, game_id)
        ON DELETE RESTRICT
    );

    /* =========================================================
       PLAYERS
       ========================================================= */

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_id INTEGER NOT NULL,

      name TEXT NOT NULL
        CHECK (length(trim(name)) > 0),

      team_tokens INTEGER NOT NULL DEFAULT 0
        CHECK (team_tokens >= 0),

      ability_card_id_1 INTEGER NULL,
      ability_card_id_2 INTEGER NULL,
      ability_card_id_3 INTEGER NULL,

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      FOREIGN KEY (ability_card_id_1)
        REFERENCES ability_cards(id)
        ON DELETE SET NULL,

      FOREIGN KEY (ability_card_id_2)
        REFERENCES ability_cards(id)
        ON DELETE SET NULL,

      FOREIGN KEY (ability_card_id_3)
        REFERENCES ability_cards(id)
        ON DELETE SET NULL,

      /*
       * Потрібно для composite FK з characters/games.
       */
      UNIQUE (id, game_id),

      /*
       * Один ability card не може бути встановлений
       * у два різні слоти одного гравця.
       */
      CHECK (
        ability_card_id_1 IS NULL
        OR ability_card_id_1 != ability_card_id_2
      ),

      CHECK (
        ability_card_id_1 IS NULL
        OR ability_card_id_1 != ability_card_id_3
      ),

      CHECK (
        ability_card_id_2 IS NULL
        OR ability_card_id_2 != ability_card_id_3
      )
    );

    /* =========================================================
       CHARACTERS
       ========================================================= */

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_id INTEGER NOT NULL,

      /*
       * NULL тільки для Капітана Софі Одеса
       * (character_name_id = 1).
       */
      player_id INTEGER NULL,

      character_name_id INTEGER NOT NULL,

      damage INTEGER NOT NULL DEFAULT 0
        CHECK (damage >= 0),

      fatigue INTEGER NOT NULL DEFAULT 0
        CHECK (fatigue >= 0),

      fright INTEGER NOT NULL DEFAULT 0
        CHECK (fright >= 0),

      madness INTEGER NOT NULL DEFAULT 0
        CHECK (madness >= 0),

      poisoning INTEGER NOT NULL DEFAULT 0
        CHECK (poisoning >= 0),

      weakness INTEGER NOT NULL DEFAULT 0
        CHECK (weakness >= 0),

      low_morale INTEGER NOT NULL DEFAULT 0
        CHECK (low_morale >= 0),

      /*
       * Ability cards
       */
      ability_card_id_1 INTEGER NULL,
      ability_card_id_2 INTEGER NULL,

      /*
       * Experience cards
       */
      experience_card_id_1 INTEGER NULL,
      experience_card_id_2 INTEGER NULL,
      experience_card_id_3 INTEGER NULL,

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      /*
       * Composite FK гарантує, що персонаж належить
       * гравцю саме цієї гри.
       */
      FOREIGN KEY (player_id, game_id)
        REFERENCES players(id, game_id)
        ON DELETE RESTRICT,

      FOREIGN KEY (character_name_id)
        REFERENCES character_names(id)
        ON DELETE RESTRICT,

      FOREIGN KEY (ability_card_id_1)
        REFERENCES ability_cards(id)
        ON DELETE SET NULL,

      FOREIGN KEY (ability_card_id_2)
        REFERENCES ability_cards(id)
        ON DELETE SET NULL,

      FOREIGN KEY (experience_card_id_1)
        REFERENCES experience_cards(id)
        ON DELETE SET NULL,

      FOREIGN KEY (experience_card_id_2)
        REFERENCES experience_cards(id)
        ON DELETE SET NULL,

      FOREIGN KEY (experience_card_id_3)
        REFERENCES experience_cards(id)
        ON DELETE SET NULL,

      /*
       * У кожній грі кожен тип персонажа існує тільки один раз.
       */
      UNIQUE (game_id, character_name_id),

      /*
       * Sophie = character_name_id 1.
       *
       * Вона ніколи не закріплюється за гравцем.
       * Усі інші персонажі обов'язково мають player_id.
       */
      CHECK (
        (
          character_name_id = 1
          AND player_id IS NULL
        )
        OR
        (
          character_name_id != 1
          AND player_id IS NOT NULL
        )
      ),

      /*
       * Один ability card не може бути двічі
       * на одному персонажі.
       */
      CHECK (
        ability_card_id_1 IS NULL
        OR ability_card_id_1 != ability_card_id_2
      ),

      /*
       * Experience cards не можуть повторюватися
       * в одного персонажа.
       */
      CHECK (
        experience_card_id_1 IS NULL
        OR experience_card_id_1 != experience_card_id_2
      ),

      CHECK (
        experience_card_id_1 IS NULL
        OR experience_card_id_1 != experience_card_id_3
      ),

      CHECK (
        experience_card_id_2 IS NULL
        OR experience_card_id_2 != experience_card_id_3
      )
    );

    /* =========================================================
       SHIP
       ========================================================= */

    CREATE TABLE IF NOT EXISTS ships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL UNIQUE,

  hull INTEGER NOT NULL DEFAULT 0 CHECK (hull >= 0),
  deck INTEGER NOT NULL DEFAULT 0 CHECK (deck >= 0),
  hospital INTEGER NOT NULL DEFAULT 0 CHECK (hospital >= 0),
  caboose INTEGER NOT NULL DEFAULT 0 CHECK (caboose >= 0),
  cabin INTEGER NOT NULL DEFAULT 0 CHECK (cabin >= 0),
  bridge INTEGER NOT NULL DEFAULT 0 CHECK (bridge >= 0),

  last_action INTEGER NOT NULL DEFAULT 0 CHECK (last_action >= 0),
  page INTEGER NOT NULL DEFAULT 0 CHECK (page >= 0),

  location TEXT NOT NULL DEFAULT '',

  meat INTEGER NOT NULL DEFAULT 0 CHECK (meat >= 0),
  vegetables INTEGER NOT NULL DEFAULT 0 CHECK (vegetables >= 0),
  grain INTEGER NOT NULL DEFAULT 0 CHECK (grain >= 0),
  materials INTEGER NOT NULL DEFAULT 0 CHECK (materials >= 0),
  artifacts INTEGER NOT NULL DEFAULT 0 CHECK (artifacts >= 0),
  coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),

  FOREIGN KEY (game_id)
    REFERENCES games(id)
    ON DELETE CASCADE
);

    /* =========================================================
       CHEST GOODS
       ========================================================= */

    CREATE TABLE IF NOT EXISTS chest_goods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_id INTEGER NOT NULL,

      goods_id INTEGER NOT NULL,

      activated INTEGER NOT NULL DEFAULT 0
        CHECK (activated IN (0, 1)),

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      FOREIGN KEY (goods_id)
        REFERENCES goods(id)
        ON DELETE RESTRICT,

      UNIQUE (game_id, goods_id)
    );

    /* =========================================================
       EVENT DECK
       ========================================================= */

    CREATE TABLE IF NOT EXISTS event_decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_id INTEGER NOT NULL,

      event_card_id INTEGER NOT NULL,

      remains_in_game INTEGER NOT NULL DEFAULT 1
        CHECK (remains_in_game IN (0, 1)),

      order_number INTEGER NOT NULL
        CHECK (order_number >= 1),

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      FOREIGN KEY (event_card_id)
        REFERENCES event_cards(id)
        ON DELETE RESTRICT,

      UNIQUE (game_id, event_card_id),
      UNIQUE (game_id, order_number)
    );

    /* =========================================================
       TASK DECK
       ========================================================= */

    CREATE TABLE IF NOT EXISTS task_decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_id INTEGER NOT NULL,

      card_number INTEGER NOT NULL
        CHECK (card_number >= 1),

      done INTEGER NOT NULL DEFAULT 0
        CHECK (done IN (0, 1)),

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      UNIQUE (game_id, card_number)
    );

    /* =========================================================
       ADVENTURE DECK
       ========================================================= */

    CREATE TABLE IF NOT EXISTS adventure_decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      game_id INTEGER NOT NULL,

      card_number INTEGER NOT NULL
        CHECK (card_number >= 1),

      name TEXT NOT NULL,

      type TEXT NOT NULL,

      totem INTEGER NOT NULL DEFAULT 0
        CHECK (totem IN (0, 1)),

      activated INTEGER NOT NULL DEFAULT 0
        CHECK (activated IN (0, 1)),

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      UNIQUE (game_id, card_number)
    );

    /* =========================================================
       INDEXES
       ========================================================= */

    CREATE INDEX IF NOT EXISTS idx_players_game_id
      ON players(game_id);

    CREATE INDEX IF NOT EXISTS idx_characters_game_id
      ON characters(game_id);

    CREATE INDEX IF NOT EXISTS idx_characters_player_id
      ON characters(player_id);

    CREATE INDEX IF NOT EXISTS idx_characters_game_player
      ON characters(game_id, player_id);

    CREATE INDEX IF NOT EXISTS idx_chest_goods_game_id
      ON chest_goods(game_id);

    CREATE INDEX IF NOT EXISTS idx_event_decks_game_order
      ON event_decks(game_id, order_number);

    CREATE INDEX IF NOT EXISTS idx_task_decks_game_card
      ON task_decks(game_id, card_number);

    CREATE INDEX IF NOT EXISTS idx_adventure_decks_game_card
      ON adventure_decks(game_id, card_number);
  `);
}

/**
 * Заповнення статичних таблиць.
 *
 * Статичні дані є спільними для всіх ігор.
 */
function seedStaticData(): void {
	db.withTransactionSync(() => {
		/* ---------------------------------------------------------
			Character names
			--------------------------------------------------------- */

		for (const character of CHARACTER_NAMES) {
			db.runSync(
				`
          INSERT OR IGNORE INTO character_names (id, name)
          VALUES (?, ?);
        `,
				character.id,
				character.name
			);
		}

		/* ---------------------------------------------------------
			Ability cards
			--------------------------------------------------------- */

		for (const card of ABILITY_CARDS) {
			db.runSync(
				`
          INSERT OR IGNORE INTO ability_cards (id, name)
          VALUES (?, ?);
        `,
				card.id,
				card.name
			);
		}

		/* ---------------------------------------------------------
			Goods
			--------------------------------------------------------- */

		for (const good of GOODS) {
			db.runSync(
				`
          INSERT OR IGNORE INTO goods (id, name, type)
          VALUES (?, ?, ?);
        `,
				good.id,
				good.name,
				good.type
			);
		}

		/* ---------------------------------------------------------
			Event cards
			--------------------------------------------------------- */

		for (const card of EVENT_CARDS) {
			db.runSync(
				`
          INSERT OR IGNORE INTO event_cards (
            id,
            name,
            type,
            property_constantly
          )
          VALUES (?, ?, ?, ?);
        `,
				card.id,
				card.name,
				card.type,
				card.property_constantly ? 1 : 0
			);
		}

		/* ---------------------------------------------------------
			Experience cards
			--------------------------------------------------------- */

		for (const card of EXPERIENCE_CARDS) {
			db.runSync(
				`
          INSERT OR IGNORE INTO experience_cards (
            id,
            name,
            character_name_id
          )
          VALUES (?, ?, ?);
        `,
				card.id,
				card.name,
				card.character_name_id
			);
		}
	});
}

/**
 * Отримати всі імена персонажів.
 */
export function getCharacterNames(): CharacterName[] {
	return db.getAllSync<CharacterName>(`
    SELECT
      id,
      name
    FROM character_names
    ORDER BY id;
  `);
}