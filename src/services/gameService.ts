import { db } from '../database';

import {
	createGame as createGameRepository,
	requireGame,
	updateGame,
	deleteGame as deleteGameRepository,
	getSavedGames,
	type SavedGame,
} from '../repositories/gameRepository';

export type { SavedGame };

import {
	createPlayer,
	getPlayers,
	requirePlayer,
	updatePlayer,
} from '../repositories/playerRepository';

import {
	createCharacter,
	getCharacters,
	getCharactersForPlayer,
	getPlayableCharacterNames,
	getExperienceCardsForCharacterNames,
	getSophie,
	updateCharacter,
	type CharacterWithName,
} from '../repositories/characterRepository';

import {
	getAbilityCards,
} from '../repositories/abilityCardRepository';

import {
	getGoods,
	requireGood,
	type Good,
} from '../repositories/goodsRepository';

import {
	getChestGoods,
	addChestGood,
	removeChestGood,
	updateChestGoodActivated,
} from '../repositories/chestGoodsRepository';

import {
	getAdventureCards,
	addAdventureCard as addAdventureCardRepository,
	deleteAdventureCard as deleteAdventureCardRepository,
	updateAdventureCardActivated,
	type AdventureCard,
} from '../repositories/adventureDeckRepository';

import {
	getEventCards,
	getEventDeck,
	addEventDeckCard,
	deleteEventDeckCard,
	updateEventCardRemainsInGame,
	type EventCard,
	type EventDeck,
} from '../repositories/eventDeckRepository';

export type { EventCard, EventDeck };



import {
	validateCharacterDistribution,
	validateExactCharacterDistribution,
	validateGameName,
	validatePlayerCount,
	normalizePlayerName,
	validateDifficulty,
	validatePlayers,
	validateGameCharacters,
	SOPHIE_CHARACTER_ID,
	PLAYER_CHARACTER_COUNT,
	isTemporaryPlayerId,
	type PlayerCharacterDistribution,
} from './gameRules';

import type {
	AbilityCard,
	ExperienceCard,
} from '../models/types';



// ============================================================
// TYPES
// ============================================================

export type NewGamePlayer = {
	id?: number;
	name: string;
	selectedCharacterIds: number[];
};

export type CreateGameInput = {
	gameName: string;
	gameDate?: string;
	playerCount: number;
	difficultyLevel: 1 | 2;
	players: NewGamePlayer[];
};

export type EditablePlayer = {
	id: number;
	name: string;
	team_tokens: number;
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;
};

export type EditableCharacterAssignment = {
	id: number;
	character_name_id: number;
	player_id: number | null;
};

export type ChangePlayersInput = {
	gameId: number;
	players: EditablePlayer[];
	characters: EditableCharacterAssignment[];
};

// ============================================================
// GAME SCREEN
// ============================================================

export type GameScreenGame = {
	id: number;
	game_name: string;
	game_date: string;
	number_of_players: number;
	difficulty_level: number;
	number_of_losses: number;
	experience: number;
	win: number;
};

export type GameScreenPlayer = {
	id: number;
	name: string;
};

export type GameScreenData = {
	game: GameScreenGame;
	players: GameScreenPlayer[];
};

export type SaveGameScreenInput = {
	gameId: number;
	experience: number;
	numberOfLosses: number;
	win: 0 | 1;
};
// ============================================================
// SAVE GAMES SCREEN
// ============================================================
export type SaveGamesScreenData = {
	games: SavedGame[];
};

// ============================================================
// PLAYER SCREEN SAVE
// ============================================================

export type PlayerCharacterSave = {
	characterId: number;

	damage: number;
	fatigue: number;
	fright: number;
	madness: number;
	poisoning: number;
	weakness: number;
	lowMorale: number;

	abilityCardId1: number | null;
	abilityCardId2: number | null;

	experienceCardId1: number | null;
	experienceCardId2: number | null;
	experienceCardId3: number | null;
};

export type SavePlayerScreenInput = {
	gameId: number;
	playerId: number;

	teamTokens: number;

	abilityCardId1: number | null;
	abilityCardId2: number | null;
	abilityCardId3: number | null;

	captain: boolean;

	characterUpdates: PlayerCharacterSave[];
};

// ============================================================
// GOODS SCREEN
// ============================================================

export type ChestStateItem = {
	added: boolean;
	activated: boolean;
};

export type ChestState = {
	[goodsId: number]: ChestStateItem;
};

export type GoodsScreenData = {
	goods: Good[];
	chestState: ChestState;
};

// ============================================================
// ADVENTURE DECK SCREEN
// ============================================================

export type AdventureDeckScreenData = {
	cards: AdventureCard[];
};

// ============================================================
// EVENT DECK SCREEN
// ============================================================

export type EventDeckScreenData = {
	eventCards: EventCard[];
	eventDeck: EventDeck[];
};
// ============================================================
// CAPTAIN SCREEN
// ============================================================

/**
 * Усі дані, необхідні CaptainScreen.
 */
export type CaptainScreenData = {
	character: CharacterWithName;
	abilityCards: AbilityCard[];
	experienceCards: ExperienceCard[];
};

/**
 * Дані для збереження Капітана Софі Одеси.
 */
export type SaveCaptainScreenInput = {
	gameId: number;
	characterId: number;

	damage: number;
	fatigue: number;
	fright: number;
	madness: number;
	poisoning: number;
	weakness: number;
	lowMorale: number;

	abilityCardId1: number | null;
	abilityCardId2: number | null;

	experienceCardId1: number | null;
	experienceCardId2: number | null;
	experienceCardId3: number | null;
};

// ============================================================
// CREATE GAME
// ============================================================

/**
 * Створює повністю готову нову гру.
 *
 * Atomic:
 * - games
 * - players
 * - characters
 * - ship
 * - current player
 *
 * Якщо будь-яка операція завершується помилкою —
 * вся транзакція відкочується.
 */
export async function createGame(
	input: CreateGameInput
): Promise<number> {
	validateGameName(input.gameName);

	const gameName = input.gameName.trim();

	validatePlayerCount(
		input.playerCount
	);

	validateDifficulty(
		input.difficultyLevel
	);

	if (
		input.players.length !==
		input.playerCount
	) {
		throw new Error(
			`Очікується ${input.playerCount} гравців, отримано ${input.players.length}.`
		);
	}

	validatePlayers(
		input.players.map(
			(player, index) => ({
				id:
					player.id ??
					-(index + 1),
				name: player.name,
			})
		)
	);

	const playableCharacters =
		await getPlayableCharacterNames();

	const playableCharacterIds =
		playableCharacters.map(
			(character) => character.id
		);

	if (
		playableCharacterIds.length !==
		PLAYER_CHARACTER_COUNT
	) {
		throw new Error(
			`У довіднику повинно бути рівно ${PLAYER_CHARACTER_COUNT} звичайних персонажів.`
		);
	}

	const assignments:
		PlayerCharacterDistribution[] =
		input.players.map(
			(player, index) => ({
				playerId:
					player.id ??
					-(index + 1),

				characterIds:
					player.selectedCharacterIds,
			})
		);

	validateCharacterDistribution(
		input.playerCount,
		assignments
	);

	validateExactCharacterDistribution(
		input.playerCount,
		assignments
	);

	const today =
		input.gameDate ??
		new Date()
			.toISOString()
			.split('T')[0];

	let createdGameId = 0;

	await db.withTransactionAsync(
		async () => {
			// ------------------------------------------------------
			// GAME
			// ------------------------------------------------------

			createdGameId =
				await createGameRepository(
					gameName,
					today,
					input.playerCount,
					input.difficultyLevel
				);

			let firstPlayerId:
				number | null = null;

			// ------------------------------------------------------
			// PLAYERS + CHARACTERS
			// ------------------------------------------------------

			for (
				const player of input.players
			) {
				const playerId =
					await createPlayer({
						gameId:
							createdGameId,

						name:
							normalizePlayerName(
								player.name
							),
					});

				firstPlayerId ??=
					playerId;

				for (
					const characterId of
					player.selectedCharacterIds
				) {
					await createCharacter(
						createdGameId,
						characterId,
						playerId
					);
				}
			}

			if (
				firstPlayerId === null
			) {
				throw new Error(
					'Не вдалося створити першого гравця.'
				);
			}

			// ------------------------------------------------------
			// SOPHIE
			// ------------------------------------------------------

			await createCharacter(
				createdGameId,
				SOPHIE_CHARACTER_ID,
				null
			);

			// ------------------------------------------------------
			// SHIP
			// ------------------------------------------------------

			await db.runAsync(
				`
        INSERT INTO ships (game_id)
        VALUES (?);
        `,
				createdGameId
			);

			// ------------------------------------------------------
			// CURRENT PLAYER
			// ------------------------------------------------------

			await updateGame(
				createdGameId,
				{
					current_player_id:
						firstPlayerId,
				}
			);
		}
	);

	if (
		createdGameId <= 0
	) {
		throw new Error(
			'Не вдалося створити гру.'
		);
	}

	return createdGameId;
}

// ============================================================
// CHANGE PLAYERS
// ============================================================

/**
 * Змінює склад гравців існуючої гри.
 *
 * Персонажі не створюються заново.
 * Їхній стан, damage, cards тощо зберігаються.
 *
 * Змінюється тільки player_id.
 *
 * Тимчасові ID:
 * -1
 * -2
 * -3
 * ...
 *
 * замінюються на реальні ID після створення.
 */
export async function changePlayers(
	input: ChangePlayersInput
): Promise<void> {
	const {
		gameId,
		players,
		characters,
	} = input;

	// ---------------------------------------------------------
	// GAME
	// ---------------------------------------------------------

	const game =
		await requireGame(gameId);

	// ---------------------------------------------------------
	// PLAYER COUNT
	// ---------------------------------------------------------

	validatePlayerCount(
		players.length
	);

	// ---------------------------------------------------------
	// PLAYERS
	// ---------------------------------------------------------

	validatePlayers(
		players.map(
			(player) => ({
				id: player.id,
				name: player.name,
			})
		)
	);

	const inputPlayerIds =
		new Set<number>();

	for (
		const player of players
	) {
		if (
			inputPlayerIds.has(
				player.id
			)
		) {
			throw new Error(
				`Гравець з ID ${player.id} вказаний більше одного разу.`
			);
		}

		inputPlayerIds.add(
			player.id
		);
	}

	const existingPlayers =
		await getPlayers(gameId);

	const existingPlayerIds =
		new Set(
			existingPlayers.map(
				(player) => player.id
			)
		);

	for (
		const player of players
	) {
		if (
			!isTemporaryPlayerId(
				player.id
			) &&
			!existingPlayerIds.has(
				player.id
			)
		) {
			throw new Error(
				`Гравець ${player.id} не належить грі ${gameId}.`
			);
		}
	}

	// ---------------------------------------------------------
	// CHARACTERS
	// ---------------------------------------------------------

	const existingCharacters =
		await getCharacters(gameId);

	validateGameCharacters(
		existingCharacters.map(
			(character) => ({
				id: character.id,

				character_name_id:
					character.character_name_id,

				player_id:
					character.player_id,
			})
		)
	);

	if (
		characters.length !==
		PLAYER_CHARACTER_COUNT + 1
	) {
		throw new Error(
			'Для гри повинно бути передано рівно 9 персонажів.'
		);
	}

	const assignmentIds =
		new Set<number>();

	const assignmentNameIds =
		new Set<number>();

	for (
		const assignment of characters
	) {
		if (
			assignmentIds.has(
				assignment.id
			)
		) {
			throw new Error(
				`Персонаж з ID ${assignment.id} вказаний більше одного разу.`
			);
		}

		assignmentIds.add(
			assignment.id
		);

		if (
			assignmentNameIds.has(
				assignment.character_name_id
			)
		) {
			throw new Error(
				`Тип персонажа ${assignment.character_name_id} вказаний більше одного разу.`
			);
		}

		assignmentNameIds.add(
			assignment.character_name_id
		);
	}

	for (
		let id = 1;
		id <= PLAYER_CHARACTER_COUNT + 1;
		id++
	) {
		if (
			!assignmentNameIds.has(id)
		) {
			throw new Error(
				`У assignments відсутній персонаж ${id}.`
			);
		}
	}

	const existingCharacterById =
		new Map(
			existingCharacters.map(
				(character) => [
					character.id,
					character,
				]
			)
		);

	for (
		const assignment of characters
	) {
		const existingCharacter =
			existingCharacterById.get(
				assignment.id
			);

		if (
			!existingCharacter
		) {
			throw new Error(
				`Персонаж ${assignment.id} не належить грі ${gameId}.`
			);
		}

		if (
			existingCharacter.character_name_id !==
			assignment.character_name_id
		) {
			throw new Error(
				`Тип персонажа ${assignment.id} не відповідає запису в БД.`
			);
		}
	}

	// ---------------------------------------------------------
	// SOPHIE
	// ---------------------------------------------------------

	const sophie =
		characters.find(
			(character) =>
				character.character_name_id ===
				SOPHIE_CHARACTER_ID
		);

	if (!sophie) {
		throw new Error(
			'У грі відсутня Капітан Софі Одеса.'
		);
	}

	if (
		sophie.player_id !== null
	) {
		throw new Error(
			'Капітан Софі Одеса не повинна мати гравця.'
		);
	}

	// ---------------------------------------------------------
	// PLAYER ASSIGNMENTS
	// ---------------------------------------------------------

	const playerAssignments:
		PlayerCharacterDistribution[] =
		players.map(
			(player) => ({
				playerId: player.id,

				characterIds:
					characters
						.filter(
							(character) =>
								character.character_name_id !==
								SOPHIE_CHARACTER_ID &&
								character.player_id ===
								player.id
						)
						.map(
							(character) =>
								character.character_name_id
						),
			})
		);

	validateCharacterDistribution(
		players.length,
		playerAssignments
	);

	validateExactCharacterDistribution(
		players.length,
		playerAssignments
	);

	// ---------------------------------------------------------
	// FINAL PLAYER IDS
	// ---------------------------------------------------------

	for (
		const character of characters
	) {
		if (
			character.character_name_id ===
			SOPHIE_CHARACTER_ID
		) {
			continue;
		}

		if (
			character.player_id === null
		) {
			throw new Error(
				`Персонаж ${character.character_name_id} не має гравця.`
			);
		}

		if (
			!inputPlayerIds.has(
				character.player_id
			)
		) {
			throw new Error(
				`Персонаж ${character.character_name_id} має недопустимого гравця ${character.player_id}.`
			);
		}
	}

	// ---------------------------------------------------------
	// ATOMIC TRANSACTION
	// ---------------------------------------------------------

	await db.withTransactionAsync(
		async () => {
			const playerIdMap =
				new Map<number, number>();

			// ------------------------------------------------------
			// CREATE / UPDATE PLAYERS
			// ------------------------------------------------------

			for (
				const player of players
			) {
				if (
					isTemporaryPlayerId(
						player.id
					)
				) {
					const newId =
						await createPlayer({
							gameId,

							name:
								normalizePlayerName(
									player.name
								),

							teamTokens:
								player.team_tokens,

							abilityCardId1:
								player.ability_card_id_1,

							abilityCardId2:
								player.ability_card_id_2,

							abilityCardId3:
								player.ability_card_id_3,
						});

					playerIdMap.set(
						player.id,
						newId
					);

					continue;
				}

				await requirePlayer(
					gameId,
					player.id
				);

				await updatePlayer(
					gameId,
					player.id,
					{
						name:
							normalizePlayerName(
								player.name
							),

						teamTokens:
							player.team_tokens,

						abilityCardId1:
							player.ability_card_id_1,

						abilityCardId2:
							player.ability_card_id_2,

						abilityCardId3:
							player.ability_card_id_3,
					}
				);

				playerIdMap.set(
					player.id,
					player.id
				);
			}

			// ------------------------------------------------------
			// REASSIGN CHARACTERS
			// ------------------------------------------------------

			for (
				const assignment of characters
			) {
				if (
					assignment.character_name_id ===
					SOPHIE_CHARACTER_ID
				) {
					continue;
				}

				if (
					assignment.player_id === null
				) {
					throw new Error(
						`Персонаж ${assignment.character_name_id} не має власника.`
					);
				}

				const realPlayerId =
					playerIdMap.get(
						assignment.player_id
					);

				if (
					realPlayerId === undefined
				) {
					throw new Error(
						`Не вдалося знайти реальний ID гравця для персонажа ${assignment.character_name_id}.`
					);
				}

				await updateCharacter(
					gameId,
					assignment.id,
					{
						playerId:
							realPlayerId,
					}
				);
			}

			// ------------------------------------------------------
			// FINAL PLAYER IDS
			// ------------------------------------------------------

			const finalPlayerIds =
				players.map(
					(player) => {
						const realId =
							playerIdMap.get(
								player.id
							);

						if (
							realId === undefined
						) {
							throw new Error(
								'Не вдалося визначити реальний ID гравця.'
							);
						}

						return realId;
					}
				);

			if (
				finalPlayerIds.length === 0
			) {
				throw new Error(
					'У грі повинен залишитися хоча б один гравець.'
				);
			}

			// ------------------------------------------------------
			// CURRENT PLAYER
			// ------------------------------------------------------

			const currentPlayerStillExists =
				game.current_player_id !== null &&
				finalPlayerIds.includes(
					game.current_player_id
				);

			const nextCurrentPlayerId =
				currentPlayerStillExists
					? game.current_player_id!
					: finalPlayerIds[0];

			// ------------------------------------------------------
			// GAME FIRST
			// ------------------------------------------------------

			await updateGame(
				gameId,
				{
					number_of_players:
						players.length,

					current_player_id:
						nextCurrentPlayerId,
				}
			);

			// ------------------------------------------------------
			// DELETE OLD PLAYERS
			// ------------------------------------------------------

			const finalIds =
				new Set(
					finalPlayerIds
				);

			for (
				const existingPlayer of
				existingPlayers
			) {
				if (
					!finalIds.has(
						existingPlayer.id
					)
				) {
					await db.runAsync(
						`
            DELETE FROM players
            WHERE id = ?
              AND game_id = ?;
            `,
						existingPlayer.id,
						gameId
					);
				}
			}
		}
	);
}

// ============================================================
// GET CAPTAIN SCREEN
// ============================================================

/**
 * Завантажує всі дані, необхідні CaptainScreen.
 *
 * CaptainScreen не працює з SQLite напряму.
 */
export async function getCaptainScreen(
	gameId: number
): Promise<CaptainScreenData> {
	// ---------------------------------------------------------
	// GAME
	// ---------------------------------------------------------

	await requireGame(gameId);

	// ---------------------------------------------------------
	// SOPHIE
	// ---------------------------------------------------------

	const captain =
		await getSophie(gameId);

	if (!captain) {
		throw new Error(
			'Капітана не знайдено'
		);
	}

	if (
		captain.character_name_id !==
		SOPHIE_CHARACTER_ID
	) {
		throw new Error(
			'Знайдений персонаж не є Капітаном Софі Одесою.'
		);
	}

	// Sophie не повинна мати player_id.
	if (
		captain.player_id !== null
	) {
		throw new Error(
			'Капітан Софі Одеса не повинна бути призначена гравцю.'
		);
	}

	// ---------------------------------------------------------
	// CARDS
	// ---------------------------------------------------------

	const [
		abilityCards,
		experienceCards,
	] = await Promise.all([
		getAbilityCards(),

		getExperienceCardsForCharacterNames([
			SOPHIE_CHARACTER_ID,
		]),
	]);

	return {
		character: captain,
		abilityCards,
		experienceCards,
	};
}

// ============================================================
// SAVE CAPTAIN SCREEN
// ============================================================

/**
 * Повністю зберігає CaptainScreen.
 *
 * Усі зміни characters виконуються
 * в одній SQLite transaction.
 *
 * Якщо будь-яка операція падає —
 * вся транзакція відкочується.
 */
export async function saveCaptainScreen(
	input: SaveCaptainScreenInput
): Promise<void> {
	const {
		gameId,
		characterId,

		damage,
		fatigue,
		fright,
		madness,
		poisoning,
		weakness,
		lowMorale,

		abilityCardId1,
		abilityCardId2,

		experienceCardId1,
		experienceCardId2,
		experienceCardId3,
	} = input;

	// ---------------------------------------------------------
	// BASIC VALIDATION
	// ---------------------------------------------------------

	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	if (
		!Number.isInteger(characterId) ||
		characterId <= 0
	) {
		throw new Error(
			'Некоректний ID персонажа.'
		);
	}

	// ---------------------------------------------------------
	// CHARACTER STATE VALIDATION
	// ---------------------------------------------------------

	if (
		!Number.isInteger(damage) ||
		damage < 0 ||
		damage > 9
	) {
		throw new Error(
			'Ушкодження мають бути від 0 до 9.'
		);
	}

	if (
		!Number.isInteger(fatigue) ||
		fatigue < 0 ||
		fatigue > 2
	) {
		throw new Error(
			'Втома має бути від 0 до 2.'
		);
	}

	const stateValues = [
		fright,
		madness,
		poisoning,
		weakness,
		lowMorale,
	];

	for (
		const value of stateValues
	) {
		if (
			value !== 0 &&
			value !== 1
		) {
			throw new Error(
				'Стани персонажа повинні мати значення 0 або 1.'
			);
		}
	}

	// ---------------------------------------------------------
	// CARD ID VALIDATION
	// ---------------------------------------------------------

	const cardIds = [
		abilityCardId1,
		abilityCardId2,

		experienceCardId1,
		experienceCardId2,
		experienceCardId3,
	];

	for (
		const cardId of cardIds
	) {
		if (
			cardId !== null &&
			(
				!Number.isInteger(cardId) ||
				cardId <= 0
			)
		) {
			throw new Error(
				'Некоректний ID картки.'
			);
		}
	}

	// ---------------------------------------------------------
	// TRANSACTION
	// ---------------------------------------------------------

	await db.withTransactionAsync(
		async () => {
			// ------------------------------------------------------
			// 1. GAME
			// ------------------------------------------------------

			await requireGame(gameId);

			// ------------------------------------------------------
			// 2. CAPTAIN
			// ------------------------------------------------------

			const captain =
				await getSophie(gameId);

			if (!captain) {
				throw new Error(
					'Капітана не знайдено.'
				);
			}

			// ------------------------------------------------------
			// 3. CHARACTER ID
			// ------------------------------------------------------

			if (
				captain.id !==
				characterId
			) {
				throw new Error(
					'Вказаний персонаж не є Капітаном цієї гри.'
				);
			}

			// ------------------------------------------------------
			// 4. SOPHIE VALIDATION
			// ------------------------------------------------------

			if (
				captain.character_name_id !==
				SOPHIE_CHARACTER_ID
			) {
				throw new Error(
					'CaptainScreen може редагувати тільки Капітана Софі Одесу.'
				);
			}

			if (
				captain.player_id !== null
			) {
				throw new Error(
					'Капітан Софі Одеса не повинна бути призначена гравцю.'
				);
			}

			// ------------------------------------------------------
			// 5. UPDATE SOPHIE
			// ------------------------------------------------------

			await updateCharacter(
				gameId,
				characterId,
				{
					damage,
					fatigue,
					fright,
					madness,
					poisoning,
					weakness,
					lowMorale,

					abilityCardId1,
					abilityCardId2,

					experienceCardId1,
					experienceCardId2,
					experienceCardId3,
				}
			);
		}
	);
}

// ============================================================
// SAVE PLAYER SCREEN
// ============================================================

/**
 * Повністю зберігає PlayerScreen.
 *
 * В одній транзакції змінюються:
 *
 * 1. players
 * 2. characters
 * 3. games.current_player_id
 *
 * Якщо будь-яка операція падає —
 * SQLite відкочує ВСІ зміни.
 */
export async function savePlayerScreen(
	input: SavePlayerScreenInput
): Promise<number | null> {
	const {
		gameId,
		playerId,

		teamTokens,

		abilityCardId1,
		abilityCardId2,
		abilityCardId3,

		captain,

		characterUpdates,
	} = input;

	// ---------------------------------------------------------
	// BASIC INPUT VALIDATION
	// ---------------------------------------------------------

	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	if (
		!Number.isInteger(playerId) ||
		playerId <= 0
	) {
		throw new Error(
			'Некоректний ID гравця.'
		);
	}

	if (
		!Number.isInteger(teamTokens) ||
		teamTokens < 0
	) {
		throw new Error(
			'Кількість жетонів має бути цілим невід’ємним числом.'
		);
	}

	// ---------------------------------------------------------
	// CHARACTER INPUT VALIDATION
	// ---------------------------------------------------------

	const characterIds =
		new Set<number>();

	for (
		const character of
		characterUpdates
	) {
		if (
			!Number.isInteger(
				character.characterId
			) ||
			character.characterId <= 0
		) {
			throw new Error(
				'Некоректний ID персонажа.'
			);
		}

		if (
			characterIds.has(
				character.characterId
			)
		) {
			throw new Error(
				`Персонаж ${character.characterId} переданий більше одного разу.`
			);
		}

		characterIds.add(
			character.characterId
		);

		if (
			!Number.isInteger(
				character.damage
			) ||
			character.damage < 0 ||
			character.damage > 9
		) {
			throw new Error(
				'Ушкодження мають бути від 0 до 9.'
			);
		}

		if (
			!Number.isInteger(
				character.fatigue
			) ||
			character.fatigue < 0 ||
			character.fatigue > 2
		) {
			throw new Error(
				'Втома має бути від 0 до 2.'
			);
		}

		const stateValues = [
			character.fright,
			character.madness,
			character.poisoning,
			character.weakness,
			character.lowMorale,
		];

		for (
			const value of stateValues
		) {
			if (
				value !== 0 &&
				value !== 1
			) {
				throw new Error(
					'Стани персонажа повинні мати значення 0 або 1.'
				);
			}
		}

		const cardIds = [
			character.abilityCardId1,
			character.abilityCardId2,

			character.experienceCardId1,
			character.experienceCardId2,
			character.experienceCardId3,
		];

		for (
			const cardId of cardIds
		) {
			if (
				cardId !== null &&
				(
					!Number.isInteger(cardId) ||
					cardId <= 0
				)
			) {
				throw new Error(
					'Некоректний ID картки.'
				);
			}
		}
	}

	// ---------------------------------------------------------
	// TRANSACTION
	// ---------------------------------------------------------

	let savedCurrentPlayerId:
		number | null = null;

	await db.withTransactionAsync(
		async () => {
			// ------------------------------------------------------
			// 1. GAME
			// ------------------------------------------------------

			const game =
				await requireGame(gameId);

			// ------------------------------------------------------
			// 2. PLAYER
			// ------------------------------------------------------

			await requirePlayer(
				gameId,
				playerId
			);

			// ------------------------------------------------------
			// 3. CHARACTERS OF PLAYER
			// ------------------------------------------------------

			const playerCharacters =
				await getCharactersForPlayer(
					gameId,
					playerId
				);

			const databaseCharacterIds =
				new Set(
					playerCharacters.map(
						(character) =>
							character.id
					)
				);

			if (
				characterUpdates.length !==
				playerCharacters.length
			) {
				throw new Error(
					'Кількість персонажів для збереження не відповідає даним гри.'
				);
			}

			for (
				const character of
				characterUpdates
			) {
				if (
					!databaseCharacterIds.has(
						character.characterId
					)
				) {
					throw new Error(
						`Персонаж ${character.characterId} не належить гравцю ${playerId} у грі ${gameId}.`
					);
				}
			}

			// ------------------------------------------------------
			// 4. PLAYER
			// ------------------------------------------------------

			await updatePlayer(
				gameId,
				playerId,
				{
					teamTokens,
					abilityCardId1,
					abilityCardId2,
					abilityCardId3,
				}
			);

			// ------------------------------------------------------
			// 5. CHARACTERS
			// ------------------------------------------------------

			for (
				const character of
				characterUpdates
			) {
				await updateCharacter(
					gameId,
					character.characterId,
					{
						damage:
							character.damage,

						fatigue:
							character.fatigue,

						fright:
							character.fright,

						madness:
							character.madness,

						poisoning:
							character.poisoning,

						weakness:
							character.weakness,

						lowMorale:
							character.lowMorale,

						abilityCardId1:
							character.abilityCardId1,

						abilityCardId2:
							character.abilityCardId2,

						experienceCardId1:
							character.experienceCardId1,

						experienceCardId2:
							character.experienceCardId2,

						experienceCardId3:
							character.experienceCardId3,
					}
				);
			}

			// ------------------------------------------------------
			// 6. CURRENT PLAYER / CAPTAIN
			// ------------------------------------------------------

			let nextCurrentPlayerId =
				game.current_player_id;

			if (captain) {
				nextCurrentPlayerId =
					playerId;
			} else if (
				game.current_player_id ===
				playerId
			) {
				nextCurrentPlayerId =
					null;
			}

			// ------------------------------------------------------
			// 7. UPDATE GAME
			// ------------------------------------------------------

			if (
				nextCurrentPlayerId !==
				game.current_player_id
			) {
				await updateGame(
					gameId,
					{
						current_player_id:
							nextCurrentPlayerId,
					}
				);
			}

			savedCurrentPlayerId =
				nextCurrentPlayerId;
		}
	);

	return savedCurrentPlayerId;
}

// ============================================================
// CURRENT PLAYER
// ============================================================

/**
 * Змінює тільки поточного гравця.
 */
export async function setCurrentPlayer(
	gameId: number,
	playerId: number
): Promise<void> {
	await requireGame(
		gameId
	);

	await requirePlayer(
		gameId,
		playerId
	);

	await updateGame(
		gameId,
		{
			current_player_id:
				playerId,
		}
	);
}

// ============================================================
// GAME PROGRESS
// ============================================================

/**
 * Оновлює прогрес гри.
 */
export async function updateGameProgress(
	gameId: number,
	input: {
		experience?: number;
		numberOfLosses?: number;
		win?: 0 | 1;
	}
): Promise<void> {
	await requireGame(
		gameId
	);

	if (
		input.experience !== undefined &&
		input.experience < 0
	) {
		throw new Error(
			'Experience не може бути від’ємним.'
		);
	}

	if (
		input.numberOfLosses !== undefined &&
		input.numberOfLosses < 0
	) {
		throw new Error(
			'Кількість поразок не може бути від’ємною.'
		);
	}

	const updates: {
		experience?: number;
		number_of_losses?: number;
		win?: 0 | 1;
	} = {};

	if (
		input.experience !== undefined
	) {
		updates.experience =
			input.experience;
	}

	if (
		input.numberOfLosses !== undefined
	) {
		updates.number_of_losses =
			input.numberOfLosses;
	}

	if (
		input.win !== undefined
	) {
		updates.win =
			input.win;
	}

	await updateGame(
		gameId,
		updates
	);
}

// ============================================================
// DELETE GAME
// ============================================================

/**
 * Повністю видаляє гру.
 *
 * Repository вже враховує FK
 * games.current_player_id.
 */
export const deleteGame = async (
	gameId: number
): Promise<void> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);
		await deleteGameRepository(gameId);
	});
};

// ============================================================
// GET GAME SCREEN
// ============================================================

/**
 * Завантажує всі дані, необхідні GameScreen.
 *
 * GameScreen не працює з SQLite напряму.
 */
export async function getGameScreen(
	gameId: number
): Promise<GameScreenData> {
	// ---------------------------------------------------------
	// GAME
	// ---------------------------------------------------------

	const game =
		await requireGame(gameId);

	// ---------------------------------------------------------
	// PLAYERS
	// ---------------------------------------------------------

	const players =
		await getPlayers(gameId);

	return {
		game: {
			id: game.id,
			game_name: game.game_name,
			game_date: game.game_date,
			number_of_players:
				game.number_of_players,
			difficulty_level:
				game.difficulty_level,
			number_of_losses:
				game.number_of_losses,
			experience:
				game.experience,
			win: game.win,
		},

		players: players.map(
			(player) => ({
				id: player.id,
				name: player.name,
			})
		),
	};
}

// ============================================================
// SAVE GAME SCREEN
// ============================================================

/**
 * Зберігає дані GameScreen.
 *
 * Оновлює:
 * - experience
 * - number_of_losses
 * - win
 *
 * Усі перевірки та UPDATE виконуються
 * всередині однієї SQLite transaction.
 */
export async function saveGameScreen(
	input: SaveGameScreenInput
): Promise<void> {
	const {
		gameId,
		experience,
		numberOfLosses,
		win,
	} = input;

	// ---------------------------------------------------------
	// BASIC VALIDATION
	// ---------------------------------------------------------

	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	if (
		!Number.isInteger(experience) ||
		experience < 0
	) {
		throw new Error(
			'Досвід не може бути від’ємним.'
		);
	}

	if (
		!Number.isInteger(numberOfLosses) ||
		numberOfLosses < 0
	) {
		throw new Error(
			'Кількість поразок не може бути від’ємною.'
		);
	}

	if (
		win !== 0 &&
		win !== 1
	) {
		throw new Error(
			'Некоректне значення результату гри.'
		);
	}

	// ---------------------------------------------------------
	// TRANSACTION
	// ---------------------------------------------------------

	await db.withTransactionAsync(
		async () => {
			// Перевіряємо, що гра існує,
			// всередині тієї ж transaction.
			await requireGame(gameId);

			await updateGame(
				gameId,
				{
					experience,
					number_of_losses:
						numberOfLosses,
					win,
				}
			);
		}
	);
}


// ============================================================
// GOODS SCREEN
// ============================================================

export const getGoodsScreen = async (
	gameId: number
): Promise<GoodsScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	let result: GoodsScreenData = {
		goods: [],
		chestState: {},
	};

	await db.withTransactionAsync(async () => {
		// ---------------------------------------------------------
		// GAME
		// ---------------------------------------------------------

		await requireGame(gameId);

		// ---------------------------------------------------------
		// GOODS
		// ---------------------------------------------------------

		const goods = await getGoods();

		// ---------------------------------------------------------
		// CHEST GOODS
		// ---------------------------------------------------------

		const chestGoods = await getChestGoods(gameId);

		const chestState: ChestState = {};

		for (const item of chestGoods) {
			chestState[item.goods_id] = {
				added: true,
				activated: item.activated === 1,
			};
		}

		// ---------------------------------------------------------
		// STARTER GOODS
		// ---------------------------------------------------------

		const starterGoods = goods.filter(
			(good) => good.type === 'Стартова'
		);

		let addedCount = 0;

		for (const good of starterGoods) {
			if (!chestState[good.id]) {
				await addChestGood(gameId, good.id);

				chestState[good.id] = {
					added: true,
					activated: false,
				};

				addedCount++;
			}
		}

		if (addedCount > 0) {
			console.log(
				`✅ Додано ${addedCount} стартових товарів до скрині`
			);
		}

		result = {
			goods,
			chestState,
		};
	});

	return result;
};

/**
 * Додає товар до скрині.
 */
export const addGoodToChest = async (
	gameId: number,
	goodsId: number
): Promise<ChestStateItem> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(goodsId) || goodsId <= 0) {
		throw new Error('Некоректний ID товару.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		const good = await requireGood(goodsId);

		if (good.type === 'Стартова') {
			throw new Error(
				'Стартове майно завжди додане до скрині'
			);
		}

		await addChestGood(gameId, goodsId);
	});

	return {
		added: true,
		activated: false,
	};
};

/**
 * Видаляє товар зі скрині.
 */
export const removeGoodFromChest = async (
	gameId: number,
	goodsId: number
): Promise<void> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(goodsId) || goodsId <= 0) {
		throw new Error('Некоректний ID товару.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		const good = await requireGood(goodsId);

		if (good.type === 'Стартова') {
			throw new Error(
				'Стартове майно завжди додане до скрині'
			);
		}

		await removeChestGood(gameId, goodsId);
	});
};

/**
 * Змінює стан активації товару.
 */
export const setGoodActivated = async (
	gameId: number,
	goodsId: number,
	activated: boolean
): Promise<boolean> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(goodsId) || goodsId <= 0) {
		throw new Error('Некоректний ID товару.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		await requireGood(goodsId);

		const chestGoods = await getChestGoods(gameId);

		const chestGood = chestGoods.find(
			(item) => item.goods_id === goodsId
		);

		if (!chestGood) {
			throw new Error(
				'Спочатку додайте товар до скрині'
			);
		}

		const newActivated: 0 | 1 = activated ? 1 : 0;

		await updateChestGoodActivated(
			gameId,
			goodsId,
			newActivated
		);
	});

	return activated;
};

// ============================================================
// ADVENTURE DECK SCREEN
// ============================================================

/**
 * Завантажує всі карти пригод конкретної гри.
 */
export const getAdventureDeckScreen = async (
	gameId: number
): Promise<AdventureDeckScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	await requireGame(gameId);

	const cards = await getAdventureCards(gameId);

	return {
		cards,
	};
};

/**
 * Додає нову карту пригод до колоди гри.
 */
export const addAdventureCard = async (
	gameId: number,
	cardNumber: number,
	name: string,
	type: string,
	totem: boolean
): Promise<void> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(cardNumber)) {
		throw new Error('Некоректний номер картки.');
	}

	const trimmedName = name.trim();

	if (!trimmedName) {
		throw new Error('Введіть назву картки.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		await addAdventureCardRepository(
			gameId,
			cardNumber,
			trimmedName,
			type,
			totem ? 1 : 0
		);
	});
};

/**
 * Видаляє карту пригод.
 */
export const deleteAdventureCard = async (
	gameId: number,
	cardId: number
): Promise<void> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(cardId) || cardId <= 0) {
		throw new Error('Некоректний ID картки.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		await deleteAdventureCardRepository(cardId);
	});
};

/**
 * Змінює стан активації карти пригод.
 */
export const setAdventureCardActivated = async (
	gameId: number,
	cardId: number,
	activated: boolean
): Promise<boolean> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(cardId) || cardId <= 0) {
		throw new Error('Некоректний ID картки.');
	}

	const newActivated: 0 | 1 = activated ? 1 : 0;

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		await updateAdventureCardActivated(
			cardId,
			newActivated
		);
	});

	return activated;
};

// ============================================================
// EVENT DECK SCREEN
// ============================================================

export const getEventDeckScreen = async (
	gameId: number
): Promise<EventDeckScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	await requireGame(gameId);

	const eventCards = await getEventCards();
	const eventDeck = await getEventDeck(gameId);

	return {
		eventCards,
		eventDeck,
	};
};

export const addEventCardToDeck = async (
	gameId: number,
	eventCardId: number,
	orderNumber: number
): Promise<EventDeck> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(eventCardId) || eventCardId <= 0) {
		throw new Error('Некоректний ID карти події.');
	}

	if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
		throw new Error('Некоректний номер карти.');
	}

	let newDeckItem: EventDeck = {
		id: 0,
		game_id: gameId,
		event_card_id: eventCardId,
		remains_in_game: 0,
		order_number: orderNumber,
	};

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		const eventCards = await getEventCards();

		const eventCard = eventCards.find(
			(card) => card.id === eventCardId
		);

		if (!eventCard) {
			throw new Error(
				`Карту події з ID ${eventCardId} не знайдено`
			);
		}

		const id = await addEventDeckCard(
			gameId,
			eventCardId,
			0,
			orderNumber
		);

		newDeckItem = {
			id,
			game_id: gameId,
			event_card_id: eventCardId,
			remains_in_game: 0,
			order_number: orderNumber,
		};
	});

	return newDeckItem;
};

export const removeEventCardFromDeck = async (
	gameId: number,
	deckId: number
): Promise<void> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(deckId) || deckId <= 0) {
		throw new Error('Некоректний ID елемента колоди.');
	}

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		await deleteEventDeckCard(deckId);
	});
};

export const setEventCardRemainsInGame = async (
	gameId: number,
	deckId: number,
	remainsInGame: boolean
): Promise<boolean> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(deckId) || deckId <= 0) {
		throw new Error('Некоректний ID елемента колоди.');
	}

	const newValue: 0 | 1 = remainsInGame ? 1 : 0;

	await db.withTransactionAsync(async () => {
		await requireGame(gameId);

		await updateEventCardRemainsInGame(
			deckId,
			newValue
		);
	});

	return remainsInGame;
};

// ============================================================
// SAVE GAMES SCREEN
// ============================================================

export const getSaveGamesScreen = async (): Promise<SaveGamesScreenData> => {
	const games = await getSavedGames();

	return {
		games,
	};
};

