import { db } from '../database';

export type AdventureCard = {
	id: number;
	game_id: number;
	card_number: number;
	name: string;
	type: string;
	totem: number; // 0 або 1
	activated: number; // 0 або 1
};

/**
 * Отримує всі карти пригод конкретної гри.
 */
export const getAdventureCards = async (
	gameId: number
): Promise<AdventureCard[]> => {
	return db.getAllAsync<AdventureCard>(
		`
      SELECT
        id,
        game_id,
        card_number,
        name,
        type,
        totem,
        activated
      FROM adventure_decks
      WHERE game_id = ?
      ORDER BY card_number;
    `,
		[gameId]
	);
};

/**
 * Додає карту пригод до колоди гри.
 */
export const addAdventureCard = async (
	gameId: number,
	cardNumber: number,
	name: string,
	type: string,
	totem: 0 | 1
): Promise<void> => {
	await db.runAsync(
		`
      INSERT INTO adventure_decks (
        game_id,
        card_number,
        name,
        type,
        totem,
        activated
      )
      VALUES (?, ?, ?, ?, ?, ?);
    `,
		[
			gameId,
			cardNumber,
			name,
			type,
			totem,
			0,
		]
	);
};

/**
 * Видаляє карту пригод за її ID.
 */
export const deleteAdventureCard = async (
	cardId: number
): Promise<void> => {
	await db.runAsync(
		`
      DELETE FROM adventure_decks
      WHERE id = ?;
    `,
		[cardId]
	);
};

/**
 * Змінює стан активації карти пригод.
 */
export const updateAdventureCardActivated = async (
	cardId: number,
	activated: 0 | 1
): Promise<void> => {
	await db.runAsync(
		`
      UPDATE adventure_decks
      SET activated = ?
      WHERE id = ?;
    `,
		[activated, cardId]
	);
};