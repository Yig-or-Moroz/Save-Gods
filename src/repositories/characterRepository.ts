// src/repositories/characterRepository.ts

import { db } from '../database';

import {
	Character,
	CharacterName,
	ExperienceCard,
} from '../models/types';

/**
 * Character разом з назвою персонажа.
 */
export type CharacterWithName = Character & {
	name: string;
};

/**
 * Дані, які можна змінювати у персонажа.
 *
 * Назви тут camelCase відповідають TypeScript,
 * а в SQL вони перетворюються на snake_case.
 */
export type CharacterUpdate = {
	playerId?: number | null;

	damage?: number;
	fatigue?: number;
	fright?: number;
	madness?: number;
	poisoning?: number;
	weakness?: number;
	lowMorale?: number;

	abilityCardId1?: number | null;
	abilityCardId2?: number | null;

	experienceCardId1?: number | null;
	experienceCardId2?: number | null;
	experienceCardId3?: number | null;
};

/**
 * Значення, які дозволено передавати SQLite.
 *
 * Це позбавляє нас від unknown[].
 */
type SQLiteValue = string | number | null | Uint8Array;

/**
 * Внутрішній опис поля CharacterUpdate.
 */
type CharacterUpdateField = {
	key: keyof CharacterUpdate;
	column: string;
};

/**
 * Дозволені поля для UPDATE characters.
 *
 * ВАЖЛИВО:
 * назви column беруться тільки з цього allowlist,
 * тому SQL injection через назву поля неможливий.
 */
const CHARACTER_UPDATE_FIELDS: CharacterUpdateField[] = [
	{
		key: 'playerId',
		column: 'player_id',
	},
	{
		key: 'damage',
		column: 'damage',
	},
	{
		key: 'fatigue',
		column: 'fatigue',
	},
	{
		key: 'fright',
		column: 'fright',
	},
	{
		key: 'madness',
		column: 'madness',
	},
	{
		key: 'poisoning',
		column: 'poisoning',
	},
	{
		key: 'weakness',
		column: 'weakness',
	},
	{
		key: 'lowMorale',
		column: 'low_morale',
	},
	{
		key: 'abilityCardId1',
		column: 'ability_card_id_1',
	},
	{
		key: 'abilityCardId2',
		column: 'ability_card_id_2',
	},
	{
		key: 'experienceCardId1',
		column: 'experience_card_id_1',
	},
	{
		key: 'experienceCardId2',
		column: 'experience_card_id_2',
	},
	{
		key: 'experienceCardId3',
		column: 'experience_card_id_3',
	},
];

/* ============================================================
	GET
	============================================================ */

/**
 * Отримати всіх персонажів гри.
 */
export async function getCharacters(
	gameId: number
): Promise<Character[]> {
	return db.getAllAsync<Character>(
		`
      SELECT
        id,
        game_id,
        player_id,
        character_name_id,
        damage,
        fatigue,
        fright,
        madness,
        poisoning,
        weakness,
        low_morale,
        ability_card_id_1,
        ability_card_id_2,
        experience_card_id_1,
        experience_card_id_2,
        experience_card_id_3
      FROM characters
      WHERE game_id = ?
      ORDER BY character_name_id ASC;
    `,
		gameId
	);
}

/**
 * Отримати всіх персонажів гри разом з їх назвами.
 */
export async function getCharactersWithNames(
	gameId: number
): Promise<CharacterWithName[]> {
	return db.getAllAsync<CharacterWithName>(
		`
      SELECT
        c.id,
        c.game_id,
        c.player_id,
        c.character_name_id,
        c.damage,
        c.fatigue,
        c.fright,
        c.madness,
        c.poisoning,
        c.weakness,
        c.low_morale,
        c.ability_card_id_1,
        c.ability_card_id_2,
        c.experience_card_id_1,
        c.experience_card_id_2,
        c.experience_card_id_3,
        cn.name
      FROM characters c
      INNER JOIN character_names cn
        ON cn.id = c.character_name_id
      WHERE c.game_id = ?
      ORDER BY c.character_name_id ASC;
    `,
		gameId
	);
}

/**
 * Отримати персонажів конкретного гравця.
 */
export async function getCharactersForPlayer(
	gameId: number,
	playerId: number
): Promise<CharacterWithName[]> {
	return db.getAllAsync<CharacterWithName>(
		`
      SELECT
        c.id,
        c.game_id,
        c.player_id,
        c.character_name_id,
        c.damage,
        c.fatigue,
        c.fright,
        c.madness,
        c.poisoning,
        c.weakness,
        c.low_morale,
        c.ability_card_id_1,
        c.ability_card_id_2,
        c.experience_card_id_1,
        c.experience_card_id_2,
        c.experience_card_id_3,
        cn.name
      FROM characters c
      INNER JOIN character_names cn
        ON cn.id = c.character_name_id
      WHERE c.game_id = ?
        AND c.player_id = ?
      ORDER BY c.character_name_id ASC;
    `,
		gameId,
		playerId
	);
}

/**
 * Отримати Капітана Софі Одесу.
 */
export async function getSophie(
	gameId: number
): Promise<CharacterWithName | null> {
	return db.getFirstAsync<CharacterWithName>(
		`
      SELECT
        c.id,
        c.game_id,
        c.player_id,
        c.character_name_id,
        c.damage,
        c.fatigue,
        c.fright,
        c.madness,
        c.poisoning,
        c.weakness,
        c.low_morale,
        c.ability_card_id_1,
        c.ability_card_id_2,
        c.experience_card_id_1,
        c.experience_card_id_2,
        c.experience_card_id_3,
        cn.name
      FROM characters c
      INNER JOIN character_names cn
        ON cn.id = c.character_name_id
      WHERE c.game_id = ?
        AND c.character_name_id = 1;
    `,
		gameId
	);
}

/**
 * Отримати одного персонажа.
 */
export async function getCharacter(
	gameId: number,
	characterId: number
): Promise<Character | null> {
	return db.getFirstAsync<Character>(
		`
      SELECT
        id,
        game_id,
        player_id,
        character_name_id,
        damage,
        fatigue,
        fright,
        madness,
        poisoning,
        weakness,
        low_morale,
        ability_card_id_1,
        ability_card_id_2,
        experience_card_id_1,
        experience_card_id_2,
        experience_card_id_3
      FROM characters
      WHERE id = ?
        AND game_id = ?;
    `,
		characterId,
		gameId
	);
}

/* ============================================================
	CREATE
	============================================================ */

/**
 * Створити одного персонажа.
 *
 * Повертає ID нового запису.
 */
export async function createCharacter(
	gameId: number,
	characterNameId: number,
	playerId: number | null
): Promise<number> {
	/*
	 * Sophie повинна бути без player_id.
	 *
	 * Це також захищено CHECK у БД, але перевіряємо
	 * правило тут, щоб отримати зрозумілу помилку.
	 */
	if (characterNameId === 1 && playerId !== null) {
		throw new Error(
			'Капітана Софі Одесу не можна призначити гравцю.'
		);
	}

	/*
	 * Усі інші персонажі повинні мати гравця.
	 */
	if (characterNameId !== 1 && playerId === null) {
		throw new Error(
			'Звичайний персонаж повинен бути призначений гравцю.'
		);
	}

	const result = await db.runAsync(
		`
      INSERT INTO characters (
        game_id,
        player_id,
        character_name_id
      )
      VALUES (?, ?, ?);
    `,
		gameId,
		playerId,
		characterNameId
	);

	return result.lastInsertRowId;
}

/**
 * Створити декілька персонажів.
 *
 * Transaction повинен бути створений service-рівнем,
 * якщо разом із персонажами створюється вся гра.
 */
export async function createCharacters(
	gameId: number,
	assignments: Array<{
		characterNameId: number;
		playerId: number | null;
	}>
): Promise<number[]> {
	const ids: number[] = [];

	for (const assignment of assignments) {
		const id = await createCharacter(
			gameId,
			assignment.characterNameId,
			assignment.playerId
		);

		ids.push(id);
	}

	return ids;
}

/* ============================================================
	UPDATE
	============================================================ */

/**
 * Оновити дані персонажа.
 *
 * Підтримує часткове оновлення:
 *
 * updateCharacter(gameId, characterId, {
 *   damage: 2,
 * });
 *
 * або:
 *
 * updateCharacter(gameId, characterId, {
 *   playerId: 5,
 *   damage: 1,
 *   fatigue: 2,
 * });
 */
export async function updateCharacter(
	gameId: number,
	characterId: number,
	input: CharacterUpdate
): Promise<void> {
	const assignments: string[] = [];

	/**
	 * Тепер тут не unknown[].
	 */
	const values: SQLiteValue[] = [];

	for (const field of CHARACTER_UPDATE_FIELDS) {
		const value = input[field.key];

		if (value === undefined) {
			continue;
		}

		assignments.push(`${field.column} = ?`);
		values.push(value);
	}

	/*
	 * Немає що оновлювати.
	 */
	if (assignments.length === 0) {
		return;
	}

	/*
	 * Додаткова перевірка Sophie.
	 *
	 * Sophie ніколи не повинна отримувати player_id.
	 */
	if (
		input.playerId !== undefined &&
		input.playerId !== null
	) {
		const character = await getCharacter(
			gameId,
			characterId
		);

		if (!character) {
			throw new Error(
				`Персонаж ${characterId} не знайдений у грі ${gameId}.`
			);
		}

		if (character.character_name_id === 1) {
			throw new Error(
				'Капітана Софі Одесу не можна призначити гравцю.'
			);
		}
	}

	const result = await db.runAsync(
		`
      UPDATE characters
      SET ${assignments.join(', ')}
      WHERE id = ?
        AND game_id = ?;
    `,
		...values,
		characterId,
		gameId
	);

	if (result.changes === 0) {
		throw new Error(
			`Персонаж ${characterId} не знайдений у грі ${gameId}.`
		);
	}
}

/* ============================================================
	ASSIGN PLAYER
	============================================================ */

/**
 * Перепризначити персонажа іншому гравцю.
 *
 * Окремо перевіряємо:
 * - player належить грі;
 * - character належить грі;
 * - Sophie не може бути призначена гравцю.
 */
export async function assignCharacterToPlayer(
	gameId: number,
	characterId: number,
	playerId: number
): Promise<void> {
	const player = await db.getFirstAsync<{
		id: number;
	}>(
		`
      SELECT id
      FROM players
      WHERE id = ?
        AND game_id = ?;
    `,
		playerId,
		gameId
	);

	if (!player) {
		throw new Error(
			`Гравець ${playerId} не належить грі ${gameId}.`
		);
	}

	const character = await getCharacter(
		gameId,
		characterId
	);

	if (!character) {
		throw new Error(
			`Персонаж ${characterId} не належить грі ${gameId}.`
		);
	}

	if (character.character_name_id === 1) {
		throw new Error(
			'Капітана Софі Одесу не можна призначити гравцю.'
		);
	}

	const result = await db.runAsync(
		`
      UPDATE characters
      SET player_id = ?
      WHERE id = ?
        AND game_id = ?;
    `,
		playerId,
		characterId,
		gameId
	);

	if (result.changes === 0) {
		throw new Error(
			`Не вдалося призначити персонажа ${characterId} гравцю ${playerId}.`
		);
	}
}

/**
 * Прибрати персонажа від гравця.
 *
 * Звичайний персонаж не може залишитися без гравця
 * за правилами гри, тому ця функція навмисно не дозволяє
 * встановити NULL.
 *
 * Для масової зміни складу гравців краще використовувати
 * gameService, який атомарно перебудовує всі призначення.
 */
export async function removeCharacterFromPlayer(
	gameId: number,
	characterId: number
): Promise<void> {
	const character = await getCharacter(
		gameId,
		characterId
	);

	if (!character) {
		throw new Error(
			`Персонаж ${characterId} не належить грі ${gameId}.`
		);
	}

	if (character.character_name_id === 1) {
		throw new Error(
			'Капітан Софі Одеса і так не має гравця.'
		);
	}

	throw new Error(
		'Звичайний персонаж не може залишатися без гравця.'
	);
}

/* ============================================================
	EXPERIENCE CARDS
	============================================================ */

/**
 * Отримати experience cards для набору персонажів.
 */
export async function getExperienceCardsForCharacterNames(
	characterNameIds: number[]
): Promise<ExperienceCard[]> {
	if (characterNameIds.length === 0) {
		return [];
	}

	const uniqueIds = [
		...new Set(characterNameIds),
	];

	const placeholders = uniqueIds
		.map(() => '?')
		.join(', ');

	return db.getAllAsync<ExperienceCard>(
		`
      SELECT
        id,
        name,
        character_name_id
      FROM experience_cards
      WHERE character_name_id IN (${placeholders})
      ORDER BY character_name_id ASC, id ASC;
    `,
		...uniqueIds
	);
}

/* ============================================================
	CHARACTER NAMES
	============================================================ */

/**
 * Отримати всі назви персонажів.
 */
export async function getAllCharacterNames(): Promise<
	CharacterName[]
> {
	return db.getAllAsync<CharacterName>(
		`
      SELECT
        id,
        name
      FROM character_names
      ORDER BY id ASC;
    `
	);
}

/**
 * Отримати 8 звичайних персонажів.
 *
 * Sophie (id = 1) сюди не входить.
 */
export async function getPlayableCharacterNames(): Promise<
	CharacterName[]
> {
	return db.getAllAsync<CharacterName>(
		`
      SELECT
        id,
        name
      FROM character_names
      WHERE id <> 1
      ORDER BY id ASC;
    `
	);
}