import { db } from '../database';
import { Game } from '../models/types';

type SQLiteValue = string | number | null | Uint8Array;

export type GameListItem = {
	id: number;
	game_name: string;
	game_date: string;
	number_of_players: number;
	difficulty_level: 1 | 2;
	number_of_losses: number;
	experience: number;
	win: 0 | 1;
	current_player_id: number | null;
};

export type GameWithPlayersRow = {
	game_id: number;
	game_name: string;
	game_date: string;
	number_of_players: number;
	difficulty_level: 1 | 2;
	number_of_losses: number;
	experience: number;
	win: 0 | 1;
	current_player_id: number | null;
	player_id: number | null;
	player_name: string | null;
	team_tokens: number | null;
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;
};

export async function getGame(
	gameId: number
): Promise<Game | null> {
	return db.getFirstAsync<Game>(
		`
    SELECT
      id,
      game_name,
      game_date,
      number_of_players,
      difficulty_level,
      number_of_losses,
      experience,
      win,
      current_player_id
    FROM games
    WHERE id = ?;
    `,
		gameId
	);
}

export async function requireGame(
	gameId: number
): Promise<Game> {
	const game = await getGame(gameId);

	if (!game) {
		throw new Error(
			`Гру з ID ${gameId} не знайдено.`
		);
	}

	return game;
}

export async function getGames(): Promise<GameListItem[]> {
	return db.getAllAsync<GameListItem>(
		`
    SELECT
      id,
      game_name,
      game_date,
      number_of_players,
      difficulty_level,
      number_of_losses,
      experience,
      win,
      current_player_id
    FROM games
    ORDER BY game_date DESC, id DESC;
    `
	);
}

/**
 * Один JOIN для списку ігор разом з гравцями.
 */
export async function getGamesWithPlayers(): Promise<
	GameWithPlayersRow[]
> {
	return db.getAllAsync<GameWithPlayersRow>(
		`
    SELECT
      g.id AS game_id,
      g.game_name,
      g.game_date,
      g.number_of_players,
      g.difficulty_level,
      g.number_of_losses,
      g.experience,
      g.win,
      g.current_player_id,
      p.id AS player_id,
      p.name AS player_name,
      p.team_tokens,
      p.ability_card_id_1,
      p.ability_card_id_2,
      p.ability_card_id_3
    FROM games g
    LEFT JOIN players p
      ON p.game_id = g.id
    ORDER BY
      g.game_date DESC,
      g.id DESC,
      p.id ASC;
    `
	);
}

export async function createGame(
	gameName: string,
	gameDate: string,
	numberOfPlayers: number,
	difficultyLevel: 1 | 2
): Promise<number> {
	const result = await db.runAsync(
		`
    INSERT INTO games (
      game_name,
      game_date,
      number_of_players,
      difficulty_level
    )
    VALUES (?, ?, ?, ?);
    `,
		gameName,
		gameDate,
		numberOfPlayers,
		difficultyLevel
	);

	return result.lastInsertRowId;
}

export async function updateGame(
	gameId: number,
	updates: Partial<
		Pick<
			Game,
			| 'game_name'
			| 'game_date'
			| 'number_of_players'
			| 'difficulty_level'
			| 'number_of_losses'
			| 'experience'
			| 'win'
			| 'current_player_id'
		>
	>
): Promise<void> {
	const entries = Object.entries(updates);

	if (entries.length === 0) {
		return;
	}

	const allowedColumns = new Set([
		'game_name',
		'game_date',
		'number_of_players',
		'difficulty_level',
		'number_of_losses',
		'experience',
		'win',
		'current_player_id',
	]);

	for (const [column] of entries) {
		if (!allowedColumns.has(column)) {
			throw new Error(
				`Недозволене поле games: ${column}`
			);
		}
	}

	const assignments = entries
		.map(([column]) => `${column} = ?`)
		.join(', ');

	const values: SQLiteValue[] = entries.map(
		([, value]) => value as SQLiteValue
	);

	await db.runAsync(
		`
    UPDATE games
    SET ${assignments}
    WHERE id = ?;
    `,
		...values,
		gameId
	);
}

export async function setCurrentPlayer(
	gameId: number,
	playerId: number | null
): Promise<void> {
	if (playerId === null) {
		await db.runAsync(
			`
      UPDATE games
      SET current_player_id = NULL
      WHERE id = ?;
      `,
			gameId
		);

		return;
	}

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

	await db.runAsync(
		`
    UPDATE games
    SET current_player_id = ?
    WHERE id = ?;
    `,
		playerId,
		gameId
	);
}

export async function deleteGame(
	gameId: number
): Promise<void> {
	await db.withTransactionAsync(async () => {
		await db.runAsync(
			`
      UPDATE games
      SET current_player_id = NULL
      WHERE id = ?;
      `,
			gameId
		);

		await db.runAsync(
			`
      DELETE FROM games
      WHERE id = ?;
      `,
			gameId
		);
	});
}

export type SavedGame = {
	id: number;
	game_name: string;
	game_date: string;
	playersNames: string[];
};

export const getSavedGames = async (): Promise<SavedGame[]> => {
	const games = await db.getAllAsync<{
		id: number;
		game_name: string;
		game_date: string;
	}>(
		`
      SELECT
        id,
        game_name,
        game_date
      FROM games
      ORDER BY game_date DESC;
    `
	);

	const players = await db.getAllAsync<{
		game_id: number;
		name: string;
	}>(
		`
      SELECT
        game_id,
        name
      FROM players
      ORDER BY game_id;
    `
	);

	const playersByGame: {
		[key: number]: string[];
	} = {};

	for (const player of players) {
		if (!playersByGame[player.game_id]) {
			playersByGame[player.game_id] = [];
		}

		if (
			player.name &&
			player.name.trim() !== ''
		) {
			playersByGame[player.game_id].push(
				player.name
			);
		}
	}

	return games.map((game) => ({
		id: game.id,
		game_name: game.game_name,
		game_date: game.game_date,
		playersNames:
			playersByGame[game.id] || [],
	}));
};