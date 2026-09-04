import { db } from '../database';

export type EventCard = {
	id: number;
	name: string;
	type: string;
	property_constantly: string | number | boolean;
};

export type EventDeck = {
	id: number;
	game_id: number;
	event_card_id: number;
	remains_in_game: number;
	order_number: number;
};

/**
 * Отримує всі карти подій.
 */
export const getEventCards = async (): Promise<EventCard[]> => {
	return db.getAllAsync<EventCard>(
		`
      SELECT
        id,
        name,
        type,
        property_constantly
      FROM event_cards
      ORDER BY name;
    `
	);
};

/**
 * Отримує колоду подій конкретної гри.
 */
export const getEventDeck = async (
	gameId: number
): Promise<EventDeck[]> => {
	return db.getAllAsync<EventDeck>(
		`
      SELECT
        id,
        game_id,
        event_card_id,
        remains_in_game,
        order_number
      FROM event_decks
      WHERE game_id = ?
      ORDER BY order_number;
    `,
		[gameId]
	);
};

/**
 * Додає карту подій до колоди гри.
 */
export const addEventDeckCard = async (
	gameId: number,
	eventCardId: number,
	remainsInGame: 0 | 1,
	orderNumber: number
): Promise<number> => {
	const result = await db.runAsync(
		`
      INSERT INTO event_decks (
        game_id,
        event_card_id,
        remains_in_game,
        order_number
      )
      VALUES (?, ?, ?, ?);
    `,
		[
			gameId,
			eventCardId,
			remainsInGame,
			orderNumber,
		]
	);

	return result.lastInsertRowId;
};

/**
 * Видаляє карту з колоди подій.
 */
export const deleteEventDeckCard = async (
	deckId: number
): Promise<void> => {
	await db.runAsync(
		`
      DELETE FROM event_decks
      WHERE id = ?;
    `,
		[deckId]
	);
};

/**
 * Змінює стан remains_in_game.
 */
export const updateEventCardRemainsInGame = async (
	deckId: number,
	remainsInGame: 0 | 1
): Promise<void> => {
	await db.runAsync(
		`
      UPDATE event_decks
      SET remains_in_game = ?
      WHERE id = ?;
    `,
		[
			remainsInGame,
			deckId,
		]
	);
};