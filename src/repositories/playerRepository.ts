import { db } from '../database';
import { Player } from '../models/types';

type SQLiteValue = string | number | null | Uint8Array;

export type CreatePlayerInput = {
	gameId: number;
	name: string;
	teamTokens?: number;
	abilityCardId1?: number | null;
	abilityCardId2?: number | null;
	abilityCardId3?: number | null;
};

export type UpdatePlayerInput = {
	name?: string;
	teamTokens?: number;
	abilityCardId1?: number | null;
	abilityCardId2?: number | null;
	abilityCardId3?: number | null;
};

export async function getPlayer(
	gameId: number,
	playerId: number
): Promise<Player | null> {
	return db.getFirstAsync<Player>(
		`
    SELECT
      id,
      game_id,
      name,
      team_tokens,
      ability_card_id_1,
      ability_card_id_2,
      ability_card_id_3
    FROM players
    WHERE id = ?
      AND game_id = ?;
    `,
		playerId,
		gameId
	);
}

export async function requirePlayer(
	gameId: number,
	playerId: number
): Promise<Player> {
	const player = await getPlayer(gameId, playerId);

	if (!player) {
		throw new Error(
			`Гравець ${playerId} не належить грі ${gameId}.`
		);
	}

	return player;
}

export async function getPlayers(
	gameId: number
): Promise<Player[]> {
	return db.getAllAsync<Player>(
		`
    SELECT
      id,
      game_id,
      name,
      team_tokens,
      ability_card_id_1,
      ability_card_id_2,
      ability_card_id_3
    FROM players
    WHERE game_id = ?
    ORDER BY id ASC;
    `,
		gameId
	);
}

export async function createPlayer(
	input: CreatePlayerInput
): Promise<number> {
	const result = await db.runAsync(
		`
    INSERT INTO players (
      game_id,
      name,
      team_tokens,
      ability_card_id_1,
      ability_card_id_2,
      ability_card_id_3
    )
    VALUES (?, ?, ?, ?, ?, ?);
    `,
		input.gameId,
		input.name.trim(),
		input.teamTokens ?? 0,
		input.abilityCardId1 ?? null,
		input.abilityCardId2 ?? null,
		input.abilityCardId3 ?? null
	);

	return result.lastInsertRowId;
}

export async function updatePlayer(
	gameId: number,
	playerId: number,
	input: UpdatePlayerInput
): Promise<void> {
	const assignments: string[] = [];
	const values: SQLiteValue[] = [];

	if (input.name !== undefined) {
		assignments.push('name = ?');
		values.push(input.name.trim());
	}

	if (input.teamTokens !== undefined) {
		assignments.push('team_tokens = ?');
		values.push(input.teamTokens);
	}

	if (input.abilityCardId1 !== undefined) {
		assignments.push('ability_card_id_1 = ?');
		values.push(input.abilityCardId1);
	}

	if (input.abilityCardId2 !== undefined) {
		assignments.push('ability_card_id_2 = ?');
		values.push(input.abilityCardId2);
	}

	if (input.abilityCardId3 !== undefined) {
		assignments.push('ability_card_id_3 = ?');
		values.push(input.abilityCardId3);
	}

	if (assignments.length === 0) {
		return;
	}

	const result = await db.runAsync(
		`
    UPDATE players
    SET ${assignments.join(', ')}
    WHERE id = ?
      AND game_id = ?;
    `,
		...values,
		playerId,
		gameId
	);

	if (result.changes === 0) {
		throw new Error(
			`Гравець ${playerId} не знайдений у грі ${gameId}.`
		);
	}
}

export async function deletePlayer(
	gameId: number,
	playerId: number
): Promise<void> {
	await db.runAsync(
		`
    DELETE FROM players
    WHERE id = ?
      AND game_id = ?;
    `,
		playerId,
		gameId
	);
}

/**
 * Перевіряє існування всіх player IDs
 * у конкретній грі одним запитом.
 */
export async function getExistingPlayerIds(
	gameId: number
): Promise<number[]> {
	const rows = await db.getAllAsync<{
		id: number;
	}>(
		`
    SELECT id
    FROM players
    WHERE game_id = ?
    ORDER BY id;
    `,
		gameId
	);

	return rows.map((row) => row.id);
}

/**
 * Кількість гравців у грі.
 */
export async function getPlayerCount(
	gameId: number
): Promise<number> {
	const row = await db.getFirstAsync<{
		count: number;
	}>(
		`
    SELECT COUNT(*) AS count
    FROM players
    WHERE game_id = ?;
    `,
		gameId
	);

	return row?.count ?? 0;
}