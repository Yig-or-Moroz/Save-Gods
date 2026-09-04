import { db } from '../database';

export type TaskCard = {
	id: number;
	game_id: number;
	card_number: number;
	done: number;
};

export const getTaskCards = async (
	gameId: number
): Promise<TaskCard[]> => {
	return db.getAllAsync<TaskCard>(
		`
      SELECT
        id,
        game_id,
        card_number,
        done
      FROM task_decks
      WHERE game_id = ?
      ORDER BY card_number;
    `,
		[gameId]
	);
};

export const requireTaskCard = async (
	gameId: number,
	cardId: number
): Promise<TaskCard> => {
	const card = await db.getFirstAsync<TaskCard>(
		`
      SELECT
        id,
        game_id,
        card_number,
        done
      FROM task_decks
      WHERE game_id = ? AND id = ?;
    `,
		[gameId, cardId]
	);

	if (!card) {
		throw new Error(
			`Картку завдання з ID ${cardId} не знайдено у цій грі.`
		);
	}

	return card;
};

export const addTaskCard = async (
	gameId: number,
	cardNumber: number
): Promise<number> => {
	const result = await db.runAsync(
		`
      INSERT INTO task_decks (
        game_id,
        card_number,
        done
      )
      VALUES (?, ?, ?);
    `,
		[gameId, cardNumber, 0]
	);

	return result.lastInsertRowId;
};

export const deleteTaskCard = async (
	gameId: number,
	cardId: number
): Promise<void> => {
	await db.runAsync(
		`
      DELETE FROM task_decks
      WHERE game_id = ? AND id = ?;
    `,
		[gameId, cardId]
	);
};

export const updateTaskCardDone = async (
	gameId: number,
	cardId: number,
	done: 0 | 1
): Promise<void> => {
	await db.runAsync(
		`
      UPDATE task_decks
      SET done = ?
      WHERE game_id = ? AND id = ?;
    `,
		[done, gameId, cardId]
	);
};