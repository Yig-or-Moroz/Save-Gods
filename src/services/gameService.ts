import { runInTransaction } from './transaction';

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
	getShip,	
	createShip,
	updateShip,
	type Ship,
} from '../repositories/shipRepository';

export type { Ship };

import {
	createPlayer,
	getPlayers,
	requirePlayer,
	updatePlayer,
	deletePlayer,
	getPlayersForLoadGameScreen,
} from '../repositories/playerRepository';

import {
	createCharacter,
	getCharacters,
	getCharactersWithNames,
	getCharactersForPlayer,
	getPlayableCharacterNames,
	getAllCharacterNames,
	getExperienceCardsForCharacterNames,
	getSophie,
	updateCharacter,
	getAllExperienceCards,
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
	getTaskCards,
	requireTaskCard,
	addTaskCard,
	deleteTaskCard,
	updateTaskCardDone,
	type TaskCard,
} from '../repositories/taskDeckRepository';

export type { TaskCard };

import {
	validateCharacterDistribution,
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
	Player,
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
// EDIT PLAYER SCREEN
// ============================================================

export type EditPlayersScreenData = {
	players: EditablePlayer[];
	characters: EditableCharacterAssignment[];
	characterNames: Array<{
		id: number;
		name: string;
	}>;
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

export type PlayerScreenCharacter = CharacterWithName & {
	character_name: string;
	experienceCards: ExperienceCard[];
};

export type PlayerScreenData = {
	player: Player;
	currentPlayerId: number | null;
	characters: PlayerScreenCharacter[];
	abilityCards: AbilityCard[];
};

// ============================================================
// PLAYER SCREEN LOAD
// ============================================================

export const getPlayerScreen = async (
	gameId: number,
	playerId: number
): Promise<PlayerScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(playerId) || playerId <= 0) {
		throw new Error('Некоректний ID гравця.');
	}

	const [player, game, abilityCards, characters] =
		await Promise.all([
		requirePlayer(gameId, playerId),
		requireGame(gameId),
		getAbilityCards(),
		getCharactersForPlayer(gameId, playerId),
	]);

	const characterNameIds = characters.map(
		(character) => character.character_name_id
	);

	const experienceCards =
		await getExperienceCardsForCharacterNames(
			characterNameIds
		);

	const experienceCardsByCharacter = new Map<
		number,
		ExperienceCard[]
	>();

	for (const characterNameId of characterNameIds) {
		experienceCardsByCharacter.set(
			characterNameId,
			experienceCards.filter(
				(card) => card.character_name_id === characterNameId
			)
		);
	}

	return {
		player,
		currentPlayerId: game.current_player_id,
		characters: characters.map((character) => ({
			...character,
			character_name: character.name,
			experienceCards:
				experienceCardsByCharacter.get(
					character.character_name_id
				) ?? [],
		})),
		abilityCards,
	};
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
// TASK DECK SCREEN
// ============================================================

export type TaskDeckScreenData = {
	cards: TaskCard[];
};

// ============================================================
// CAPTAIN SCREEN
// ============================================================

export type CaptainScreenData = {
	character: CharacterWithName;
	abilityCards: AbilityCard[];
	experienceCards: ExperienceCard[];
};

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
// LOAD GAME SCREEN
// ============================================================

export type LoadGameScreenData = {
	games: SavedGame[];
};


// ============================================================
// LAYOUT GAME SCREEN
// ============================================================

export type LayoutGameScreenData = {
	game: {
		id: number;
		game_name: string;
		number_of_players: number;
		difficulty_level: number;
		experience: number;
		number_of_losses: number;
		win: number;
		current_player_id: number | null;
	};

	players: Array<{
		id: number;
		name: string;
		team_tokens: number;
		ability_card_id_1: number | null;
		ability_card_id_2: number | null;
		ability_card_id_3: number | null;
	}>;

	ship: Ship | null;

	allGoods: Array<{
		id: number;
		name: string;
		type: string;
		activated: boolean;
		isTotem: boolean;
		source: 'chest' | 'adventure';
	}>;

	eventCards: Array<{
		id: number;
		name: string;
		type: string;
		property_constantly: string | number | boolean;
		order_number: number;
		remains_in_game: number;
	}>;

	characters: CharacterWithName[];

	abilityCards: AbilityCard[];

	experienceCards: ExperienceCard[];

	taskCards: TaskCard[];
};

// ============================================================
// ABILITY CARD UNIQUENESS
// ============================================================

type AbilityCardOwnerType =
	| 'гравець'
	| 'персонаж';

type AbilityCardUsage = {
	ownerType: AbilityCardOwnerType;
	ownerName: string;
};

type AbilityCardSlots = {
	abilityCardId1: number | null;
	abilityCardId2: number | null;
	abilityCardId3: number | null;
};

type CharacterAbilityCardSlots = {
	abilityCardId1: number | null;
	abilityCardId2: number | null;
};

type AbilityCardValidationInput = {
	players?: Array<{
		id: number;
		name: string;
		abilityCardId1: number | null;
		abilityCardId2: number | null;
		abilityCardId3: number | null;
	}>;

	playerUpdates?: Map<
		number,
		AbilityCardSlots
	>;

	characterUpdates?: Map<
		number,
		CharacterAbilityCardSlots
	>;
};

// ============================================================
// SHIP SCREEN
// ============================================================
export type ShipScreenData = {
	ship: Ship;
};

export type SaveShipScreenInput = {
	gameId: number;
	hull: number;
	deck: number;
	hospital: number;
	caboose: number;
	cabin: number;
	bridge: number;
	lastAction: number;
	page: number;
	location: string;
	meat: number;
	vegetables: number;
	grain: number;
	materials: number;
	artifacts: number;
	coins: number;
};

/**
 * Перевіряє глобальну унікальність усіх Ability Cards
 * у межах конкретної гри.
 *
 * Важливо:
 * - карта не може бути двічі у одного гравця;
 * - карта не може бути у двох різних гравців;
 * - карта не може бути у двох персонажів;
 * - карта не може бути одночасно у гравця і персонажа;
 * - Captain Sophie також бере участь у загальній перевірці.
 *
 * Перевірка виконується ДО transaction з UPDATE.
 * Це дозволяє показувати нормальну бізнес-помилку,
 * а не SQLite CHECK constraint / finalizeAsync.
 */
async function validateAbilityCardUniqueness(
	gameId: number,
	input: AbilityCardValidationInput = {}
): Promise<void> {
	const [
		databasePlayers,
		databaseCharacters,
		abilityCards,
	] = await Promise.all([
		getPlayers(gameId),
		getCharactersWithNames(gameId),
		getAbilityCards(),
	]);

	const abilityCardNamesById = new Map(
		abilityCards.map((card) => [
			card.id,
			card.name,
		])
	);

	const availableAbilityCardIds = new Set(
		abilityCards.map((card) => card.id)
	);

	const usedCards = new Map<
		number,
		AbilityCardUsage
	>();

	const registerCard = (
		cardId: number | null,
		ownerType: AbilityCardOwnerType,
		ownerName: string
	) => {
		if (cardId === null) {
			return;
		}

		if (
			!Number.isInteger(cardId) ||
			cardId <= 0
		) {
			throw new Error(
				'Некоректний ID карти здібностей.'
			);
		}

		if (!availableAbilityCardIds.has(cardId)) {
			throw new Error(
				`Карту здібностей з ID ${cardId} не знайдено.`
			);
		}

		const existing = usedCards.get(cardId);

		if (existing) {
			const cardName =
				abilityCardNamesById.get(cardId) ??
				`ID ${cardId}`;

			const ownerLabel =
				existing.ownerType === 'гравець'
					? 'гравцем'
					: 'персонажем';

			throw new Error(
				`Карта здібностей «${cardName}» вже використовується ${ownerLabel} «${existing.ownerName}».`
			);
		}

		usedCards.set(cardId, {
			ownerType,
			ownerName,
		});
	};

	// ------------------------------------------------------------
	// PLAYERS
	// ------------------------------------------------------------

	if (input.players) {
		for (const player of input.players) {
			registerCard(
				player.abilityCardId1,
				'гравець',
				player.name
			);

			registerCard(
				player.abilityCardId2,
				'гравець',
				player.name
			);

			registerCard(
				player.abilityCardId3,
				'гравець',
				player.name
			);
		}
	} else {
		for (const player of databasePlayers) {
			const update =
				input.playerUpdates?.get(player.id);

			const card1 =
				update !== undefined
					? update.abilityCardId1
					: player.ability_card_id_1;

			const card2 =
				update !== undefined
					? update.abilityCardId2
					: player.ability_card_id_2;

			const card3 =
				update !== undefined
					? update.abilityCardId3
					: player.ability_card_id_3;

			registerCard(
				card1,
				'гравець',
				player.name
			);

			registerCard(
				card2,
				'гравець',
				player.name
			);

			registerCard(
				card3,
				'гравець',
				player.name
			);
		}
	}

	// ------------------------------------------------------------
	// CHARACTERS
	// ------------------------------------------------------------

	for (const character of databaseCharacters) {
		const update =
			input.characterUpdates?.get(
				character.id
			);

		const card1 =
			update !== undefined
				? update.abilityCardId1
				: character.ability_card_id_1;

		const card2 =
			update !== undefined
				? update.abilityCardId2
				: character.ability_card_id_2;

		const characterName = character.name;

		registerCard(
			card1,
			'персонаж',
			characterName
		);

		registerCard(
			card2,
			'персонаж',
			characterName
		);
	}
}


// ============================================================
// CREATE GAME
// ============================================================

export const getNewGameScreen = async (): Promise<{
	characters: Array<{ id: number; name: string }>;
}> => {
	const characters = await getAllCharacterNames();

	return {
		characters: characters.filter(
			(character) => character.id !== SOPHIE_CHARACTER_ID
		),
	};
};

export async function createGame(
	input: CreateGameInput
): Promise<number> {
	validateGameName(input.gameName);

	const gameName =
		input.gameName.trim();

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

	const today =
		input.gameDate ??
		new Date()
			.toISOString()
			.split('T')[0];

	if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
		throw new Error('Дата гри повинна мати формат YYYY-MM-DD.');
	}

	const parsedDate = new Date(`${today}T00:00:00Z`);
	if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== today) {
		throw new Error('Некоректна дата гри.');
	}

	let createdGameId = 0;

	await runInTransaction(
		async () => {
			// --------------------------------------------------------
			// GAME
			// --------------------------------------------------------

			createdGameId =
				await createGameRepository(
					gameName,
					today,
					input.playerCount,
					input.difficultyLevel
				);

			let firstPlayerId:
				number | null = null;

			// --------------------------------------------------------
			// PLAYERS + CHARACTERS
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// SOPHIE
			// --------------------------------------------------------

			await createCharacter(
				createdGameId,
				SOPHIE_CHARACTER_ID,
				null
			);

			// --------------------------------------------------------
			// SHIP
			// --------------------------------------------------------

			await createShip(createdGameId);

			// --------------------------------------------------------
			// CURRENT PLAYER
			// --------------------------------------------------------

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

export async function changePlayers(
	input: ChangePlayersInput
): Promise<void> {
	const {
		gameId,
		players,
		characters,
	} = input;

	// ------------------------------------------------------------
	// GAME
	// ------------------------------------------------------------

	const game =
		await requireGame(gameId);

	// ------------------------------------------------------------
	// PLAYER COUNT
	// ------------------------------------------------------------

	validatePlayerCount(
		players.length
	);

	// ------------------------------------------------------------
	// PLAYERS
	// ------------------------------------------------------------

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

		if (
			!Number.isInteger(
				player.team_tokens
			) ||
			player.team_tokens < 0
		) {
			throw new Error(
				`Некоректна кількість жетонів у гравця «${player.name}».`
			);
		}

		const playerCardIds = [
			player.ability_card_id_1,
			player.ability_card_id_2,
			player.ability_card_id_3,
		];

		for (
			const cardId of playerCardIds
		) {
			if (
				cardId !== null &&
				(
					!Number.isInteger(cardId) ||
					cardId <= 0
				)
			) {
				throw new Error(
					`Некоректний ID карти здібностей у гравця «${player.name}».`
				);
			}
		}
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

	// ------------------------------------------------------------
	// CHARACTERS
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// SOPHIE
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// PLAYER ASSIGNMENTS
	// ------------------------------------------------------------

	const playerAssignments:
		PlayerCharacterDistribution[] =
		players.map(
			(player) => ({
				playerId:
					player.id,

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

	// ------------------------------------------------------------
	// FINAL PLAYER IDS
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// ABILITY CARDS
	//
	// Перевіряємо фінальний набір карт усіх гравців.
	// Тут тимчасові ID не мають значення — нам потрібні
	// тільки самі карти та їхні власники.
	// ------------------------------------------------------------

	await validateAbilityCardUniqueness(
		gameId,
		{
			players: players.map(
				(player) => ({
					id: player.id,
					name: player.name,
					abilityCardId1:
						player.ability_card_id_1,
					abilityCardId2:
						player.ability_card_id_2,
					abilityCardId3:
						player.ability_card_id_3,
				})
			),
		}
	);

	// ------------------------------------------------------------
	// ATOMIC TRANSACTION
	// ------------------------------------------------------------

	await runInTransaction(
		async () => {
			const playerIdMap =
				new Map<number, number>();

			// --------------------------------------------------------
			// CREATE / UPDATE PLAYERS
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// REASSIGN CHARACTERS
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// FINAL PLAYER IDS
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// CURRENT PLAYER
			// --------------------------------------------------------

			const currentPlayerStillExists =
				game.current_player_id !== null &&
				finalPlayerIds.includes(
					game.current_player_id
				);

			const nextCurrentPlayerId =
				currentPlayerStillExists
					? game.current_player_id!
					: finalPlayerIds[0];

			// --------------------------------------------------------
			// GAME FIRST
			// --------------------------------------------------------

			await updateGame(
				gameId,
				{
					number_of_players:
						players.length,

					current_player_id:
						nextCurrentPlayerId,
				}
			);

			// --------------------------------------------------------
			// DELETE OLD PLAYERS
			// --------------------------------------------------------

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
					await deletePlayer(
						gameId,
						existingPlayer.id
					);
				}
			}
		}
	);
}


// ============================================================
// GET CAPTAIN SCREEN
// ============================================================

export async function getCaptainScreen(
	gameId: number
): Promise<CaptainScreenData> {
	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	await requireGame(
		gameId
	);

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

	if (
		captain.player_id !== null
	) {
		throw new Error(
			'Капітан Софі Одеса не повинна бути призначена гравцю.'
		);
	}

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

	// ------------------------------------------------------------
	// BASIC VALIDATION
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// CHARACTER STATE
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// CARD ID VALIDATION
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// GAME + CAPTAIN VALIDATION
	//
	// Робимо ДО transaction, щоб помилки бізнес-логіки
	// не перетворювалися на finalizeAsync / rollback шум.
	// ------------------------------------------------------------

	await requireGame(
		gameId
	);

	const captain =
		await getSophie(gameId);

	if (!captain) {
		throw new Error(
			'Капітана не знайдено.'
		);
	}

	if (
		captain.id !==
		characterId
	) {
		throw new Error(
			'Вказаний персонаж не є Капітаном цієї гри.'
		);
	}

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

	// ------------------------------------------------------------
	// ABILITY CARD UNIQUENESS
	//
	// Важливо: перевіряємо фінальний стан Софі разом
	// з усіма іншими персонажами та гравцями.
	// ------------------------------------------------------------

	const characterUpdatesById =
		new Map<
			number,
			CharacterAbilityCardSlots
		>();

	characterUpdatesById.set(
		characterId,
		{
			abilityCardId1,
			abilityCardId2,
		}
	);

	await validateAbilityCardUniqueness(
		gameId,
		{
			characterUpdates:
				characterUpdatesById,
		}
	);

	// ------------------------------------------------------------
	// TRANSACTION
	// ------------------------------------------------------------

	await runInTransaction(
		async () => {
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

	// ------------------------------------------------------------
	// BASIC INPUT VALIDATION
	// ------------------------------------------------------------

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

	// ------------------------------------------------------------
	// PLAYER ABILITY CARDS
	// ------------------------------------------------------------

	const playerCardIds = [
		abilityCardId1,
		abilityCardId2,
		abilityCardId3,
	];

	for (
		const cardId of playerCardIds
	) {
		if (
			cardId !== null &&
			(
				!Number.isInteger(cardId) ||
				cardId <= 0
			)
		) {
			throw new Error(
				'Некоректний ID карти здібностей гравця.'
			);
		}
	}

	// ------------------------------------------------------------
	// CHARACTER INPUT VALIDATION
	// ------------------------------------------------------------

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

		// ----------------------------------------------------------
		// CHARACTER STATE
		// ----------------------------------------------------------

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

		// ----------------------------------------------------------
		// CARDS
		// ----------------------------------------------------------

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

	// ------------------------------------------------------------
	// GAME
	// ------------------------------------------------------------

	const game =
		await requireGame(
			gameId
		);

	// ------------------------------------------------------------
	// PLAYER
	// ------------------------------------------------------------

	await requirePlayer(
		gameId,
		playerId
	);

	// ------------------------------------------------------------
	// PLAYER CHARACTERS
	// ------------------------------------------------------------

	const playerCharacters =
		await getCharactersForPlayer(
			gameId,
			playerId
		);

	const databaseCharacterIds =
		new Set(
			playerCharacters.map(
				(character) => character.id
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

	// ------------------------------------------------------------
	// ABILITY CARD UNIQUENESS
	//
	// ВАЖЛИВО:
	// Будуємо фінальний стан усіх карт ДО UPDATE.
	//
	// Тому:
	// A -> B
	// B -> A
	//
	// може бути дозволено, якщо обидві зміни приходять
	// в characterUpdates одночасно.
	// ------------------------------------------------------------

	const playerUpdatesById =
		new Map<
			number,
			AbilityCardSlots
		>();

	playerUpdatesById.set(
		playerId,
		{
			abilityCardId1,
			abilityCardId2,
			abilityCardId3,
		}
	);

	const characterUpdatesById =
		new Map<
			number,
			CharacterAbilityCardSlots
		>();

	for (
		const character of
		characterUpdates
	) {
		characterUpdatesById.set(
			character.characterId,
			{
				abilityCardId1:
					character.abilityCardId1,

				abilityCardId2:
					character.abilityCardId2,
			}
		);
	}

	await validateAbilityCardUniqueness(
		gameId,
		{
			playerUpdates:
				playerUpdatesById,

			characterUpdates:
				characterUpdatesById,
		}
	);

	// ------------------------------------------------------------
	// TRANSACTION
	// ------------------------------------------------------------

	let savedCurrentPlayerId:
		number | null = null;

	await runInTransaction(
		async () => {
			// --------------------------------------------------------
			// PLAYER
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// CHARACTERS
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// CURRENT PLAYER / CAPTAIN
			// --------------------------------------------------------

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

			// --------------------------------------------------------
			// UPDATE GAME
			// --------------------------------------------------------

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

export async function setCurrentPlayer(
	gameId: number,
	playerId: number
): Promise<void> {
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

export async function updateGameProgress(
	gameId: number,
	input: {
		experience?: number;
		numberOfLosses?: number;
		win?: 0 | 1;
	}
): Promise<void> {
	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	await requireGame(
		gameId
	);

	if (
		input.experience !== undefined &&
		(
			!Number.isInteger(
				input.experience
			) ||
			input.experience < 0
		)
	) {
		throw new Error(
			'Experience не може бути від’ємним.'
		);
	}

	if (
		input.numberOfLosses !== undefined &&
		(
			!Number.isInteger(
				input.numberOfLosses
			) ||
			input.numberOfLosses < 0
		)
	) {
		throw new Error(
			'Кількість поразок не може бути від’ємною.'
		);
	}

	if (
		input.win !== undefined &&
		input.win !== 0 &&
		input.win !== 1
	) {
		throw new Error(
			'Некоректне значення результату гри.'
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

export const deleteGame =
	async (
		gameId: number
	): Promise<void> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				await deleteGameRepository(
					gameId
				);
			}
		);
	};


// ============================================================
// GET GAME SCREEN
// ============================================================

export async function getGameScreen(
	gameId: number
): Promise<GameScreenData> {
	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	const game =
		await requireGame(
			gameId
		);

	const players =
		await getPlayers(
			gameId
		);

	return {
		game: {
			id: game.id,

			game_name:
				game.game_name,

			game_date:
				game.game_date,

			number_of_players:
				game.number_of_players,

			difficulty_level:
				game.difficulty_level,

			number_of_losses:
				game.number_of_losses,

			experience:
				game.experience,

			win:
				game.win,
		},

		players:
			players.map(
				(player) => ({
					id:
						player.id,

					name:
						player.name,
				})
			),
	};
}


// ============================================================
// SAVE GAME SCREEN
// ============================================================

export async function saveGameScreen(
	input: SaveGameScreenInput
): Promise<void> {
	const {
		gameId,
		experience,
		numberOfLosses,
		win,
	} = input;

	// ------------------------------------------------------------
	// BASIC VALIDATION
	// ------------------------------------------------------------

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

	await runInTransaction(
		async () => {
			await requireGame(
				gameId
			);

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

export const getGoodsScreen =
	async (
		gameId: number
	): Promise<GoodsScreenData> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		let result:
			GoodsScreenData = {
			goods: [],
			chestState: {},
		};

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				const goods =
					await getGoods();

				const chestGoods =
					await getChestGoods(
						gameId
					);

				const chestState:
					ChestState = {};

				for (
					const item of chestGoods
				) {
					chestState[
						item.goods_id
					] = {
						added: true,
						activated:
							item.activated === 1,
					};
				}

				const starterGoods =
					goods.filter(
						(good) =>
							good.type ===
							'Стартова'
					);

				let addedCount = 0;

				for (
					const good of
					starterGoods
				) {
					if (
						!chestState[good.id]
					) {
						await addChestGood(
							gameId,
							good.id
						);

						chestState[
							good.id
						] = {
							added: true,
							activated: false,
						};

						addedCount++;
					}
				}

				if (
					addedCount > 0
				) {
					console.log(
						`✅ Додано ${addedCount} стартових товарів до скрині`
					);
				}

				result = {
					goods,
					chestState,
				};
			}
		);

		return result;
	};


// ============================================================
// ADD GOOD TO CHEST
// ============================================================

export const addGoodToChest =
	async (
		gameId: number,
		goodsId: number
	): Promise<ChestStateItem> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		if (
			!Number.isInteger(goodsId) ||
			goodsId <= 0
		) {
			throw new Error(
				'Некоректний ID товару.'
			);
		}

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				const good =
					await requireGood(
						goodsId
					);

				if (
					good.type ===
					'Стартова'
				) {
					throw new Error(
						'Стартове майно завжди додане до скрині'
					);
				}

				await addChestGood(
					gameId,
					goodsId
				);
			}
		);

		return {
			added: true,
			activated: false,
		};
	};


// ============================================================
// REMOVE GOOD FROM CHEST
// ============================================================

export const removeGoodFromChest =
	async (
		gameId: number,
		goodsId: number
	): Promise<void> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		if (
			!Number.isInteger(goodsId) ||
			goodsId <= 0
		) {
			throw new Error(
				'Некоректний ID товару.'
			);
		}

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				const good =
					await requireGood(
						goodsId
					);

				if (
					good.type ===
					'Стартова'
				) {
					throw new Error(
						'Стартове майно завжди додане до скрині'
					);
				}

				await removeChestGood(
					gameId,
					goodsId
				);
			}
		);
	};


// ============================================================
// SET GOOD ACTIVATED
// ============================================================

export const setGoodActivated =
	async (
		gameId: number,
		goodsId: number,
		activated: boolean
	): Promise<boolean> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		if (
			!Number.isInteger(goodsId) ||
			goodsId <= 0
		) {
			throw new Error(
				'Некоректний ID товару.'
			);
		}

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				await requireGood(
					goodsId
				);

				const chestGoods =
					await getChestGoods(
						gameId
					);

				const chestGood =
					chestGoods.find(
						(item) =>
							item.goods_id ===
							goodsId
					);

				if (!chestGood) {
					throw new Error(
						'Спочатку додайте товар до скрині'
					);
				}

				const newActivated:
					0 | 1 =
					activated ? 1 : 0;

				await updateChestGoodActivated(
					gameId,
					goodsId,
					newActivated
				);
			}
		);

		return activated;
	};


// ============================================================
// ADVENTURE DECK SCREEN
// ============================================================

export const getAdventureDeckScreen =
	async (
		gameId: number
	): Promise<AdventureDeckScreenData> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		await requireGame(
			gameId
		);

		const cards =
			await getAdventureCards(
				gameId
			);

		return {
			cards,
		};
	};


// ============================================================
// ADD ADVENTURE CARD
// ============================================================

export const addAdventureCard =
	async (
		gameId: number,
		cardNumber: number,
		name: string,
		type: string,
		totem: boolean
	): Promise<void> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		if (
			!Number.isInteger(
				cardNumber
			)
		) {
			throw new Error(
				'Некоректний номер картки.'
			);
		}

		const trimmedName =
			name.trim();

		if (!trimmedName) {
			throw new Error(
				'Введіть назву картки.'
			);
		}

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				await addAdventureCardRepository(
					gameId,
					cardNumber,
					trimmedName,
					type,
					totem ? 1 : 0
				);
			}
		);
	};


// ============================================================
// DELETE ADVENTURE CARD
// ============================================================

export const deleteAdventureCard =
	async (
		gameId: number,
		cardId: number
	): Promise<void> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		if (
			!Number.isInteger(cardId) ||
			cardId <= 0
		) {
			throw new Error(
				'Некоректний ID картки.'
			);
		}

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				await deleteAdventureCardRepository(
					gameId,
					cardId
				);
			}
		);
	};


// ============================================================
// SET ADVENTURE CARD ACTIVATED
// ============================================================

export const setAdventureCardActivated =
	async (
		gameId: number,
		cardId: number,
		activated: boolean
	): Promise<boolean> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		if (
			!Number.isInteger(cardId) ||
			cardId <= 0
		) {
			throw new Error(
				'Некоректний ID картки.'
			);
		}

		const newActivated:
			0 | 1 =
			activated ? 1 : 0;

		await runInTransaction(
			async () => {
				await requireGame(
					gameId
				);

				await updateAdventureCardActivated(
					gameId,
					cardId,
					newActivated
				);
			}
		);

		return activated;
	};


// ============================================================
// EVENT DECK SCREEN
// ============================================================

export const getEventDeckScreen =
	async (
		gameId: number
	): Promise<EventDeckScreenData> => {
		if (
			!Number.isInteger(gameId) ||
			gameId <= 0
		) {
			throw new Error(
				'Некоректний ID гри.'
			);
		}

		await requireGame(
			gameId
		);

		const [
			eventCards,
			eventDeck,
		] = await Promise.all([
			getEventCards(),
			getEventDeck(gameId),
		]);

		return {
			eventCards,
			eventDeck,
		};
	};


// ============================================================
// ADD EVENT CARD TO DECK
// ============================================================

export const addEventCardToDeck = async (
	gameId: number,
	eventCardId: number
): Promise<EventDeck> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(eventCardId) || eventCardId <= 0) {
		throw new Error('Некоректний ID карти події.');
	}

	let newCard!: EventDeck;

	await runInTransaction(async () => {
		await requireGame(gameId);

		const eventCard = (await getEventCards()).find(
			(card) => card.id === eventCardId
		);

		if (!eventCard) {
			throw new Error(
				`Карту події з ID ${eventCardId} не знайдено.`
			);
		}

		const eventDeck = await getEventDeck(gameId);

		if (eventDeck.some((card) => card.event_card_id === eventCardId)) {
			throw new Error('Ця карта події вже додана до колоди.');
		}

		const maxOrder = Math.max(
			0,
			...eventDeck.map((item) => item.order_number)
		);

		const orderNumber = maxOrder + 1;
		const id = await addEventDeckCard(
			gameId,
			eventCardId,
			0,
			orderNumber
		);

		newCard = {
			id,
			game_id: gameId,
			event_card_id: eventCardId,
			remains_in_game: 0,
			order_number: orderNumber,
		};
	});

	return newCard;
};

// ============================================================
// REMOVE EVENT CARD FROM DECK
// ============================================================

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

	await requireGame(gameId);

	await deleteEventDeckCard(gameId, deckId);
};


// ============================================================
// SET EVENT CARD REMAINS IN GAME
// ============================================================

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

	await requireGame(gameId);

	const newValue: 0 | 1 = remainsInGame ? 1 : 0;

	await updateEventCardRemainsInGame(
		gameId,
		deckId,
		newValue
	);

	return remainsInGame;
};

// ============================================================
// SAVE GAMES SCREEN
// ============================================================

export const getSaveGamesScreen =
	async (): Promise<SaveGamesScreenData> => {
		const games =
			await getSavedGames();

		return {
			games,
		};
	};

// ============================================================
// SHIP SCREEN
// ============================================================

export const getShipScreen = async (
	gameId: number
): Promise<ShipScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	await requireGame(gameId);

	const ship = await getShip(gameId);

	if (!ship) {
		throw new Error(
			`Корабель для гри ${gameId} не знайдений.`
		);
	}

	return {
		ship,
	};
};

export const saveShipScreen = async (
	input: SaveShipScreenInput
): Promise<void> => {
	const {
		gameId,
		hull,
		deck,
		hospital,
		caboose,
		cabin,
		bridge,
		lastAction,
		page,
		location,
		meat,
		vegetables,
		grain,
		materials,
		artifacts,
		coins,
	} = input;

	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	const damageFields = [
		['Корпус', hull, 0, 1],
		['Палуба', deck, 0, 2],
		['Шпиталь', hospital, 0, 2],
		['Камбуз', caboose, 0, 2],
		['Каюта', cabin, 0, 2],
		['Місток', bridge, 0, 2],
	] as const;

	for (const [name, value, min, max] of damageFields) {
		if (
			!Number.isInteger(value) ||
			value < min ||
			value > max
		) {
			throw new Error(
				`Некоректне значення пошкодження: ${name}.`
			);
		}
	}

	if (
		!Number.isInteger(lastAction) ||
		lastAction < 1 ||
		lastAction > 6
	) {
		throw new Error(
			'Остання дія корабля повинна бути від 1 до 6.'
		);
	}

	if (!Number.isInteger(page) || page < 0) {
		throw new Error(
			'Номер сторінки не може бути від’ємним.'
		);
	}

	const resourceFields = [
		['м’яса', meat],
		['овочів', vegetables],
		['зерна', grain],
		['матеріалів', materials],
		['артефактів', artifacts],
		['монет', coins],
	] as const;

	for (const [name, value] of resourceFields) {
		if (
			!Number.isInteger(value) ||
			value < 0
		) {
			throw new Error(
				`Кількість ${name} не може бути від’ємною.`
			);
		}
	}

	await runInTransaction(async () => {
		await requireGame(gameId);

		const ship = await getShip(gameId);

		if (!ship) {
			throw new Error(
				`Корабель для гри ${gameId} не знайдений.`
			);
		}

		await updateShip(gameId, {
			hull,
			deck,
			hospital,
			caboose,
			cabin,
			bridge,
			lastAction,
			page,
			location: location.trim(),
			meat,
			vegetables,
			grain,
			materials,
			artifacts,
			coins,
		});
	});
};

// ============================================================
// TASK DECK SCREEN
// ============================================================

export const getTaskDeckScreen = async (
	gameId: number
): Promise<TaskDeckScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	await requireGame(gameId);

	const cards = await getTaskCards(gameId);

	return {
		cards,
	};
};

export const addTaskCardToDeck = async (
	gameId: number,
	cardNumber: number
): Promise<TaskCard> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (
		!Number.isInteger(cardNumber) ||
		cardNumber < 1 ||
		cardNumber > 218
	) {
		throw new Error(
			'Номер картки завдання повинен бути від 1 до 218.'
		);
	}

	let newCard: TaskCard = {
		id: 0,
		game_id: gameId,
		card_number: cardNumber,
		done: 0,
	};

	await runInTransaction(async () => {
		await requireGame(gameId);

		const existingCards = await getTaskCards(gameId);

		const exists = existingCards.some(
			(card) => card.card_number === cardNumber
		);

		if (exists) {
			throw new Error(
				`Картка №${cardNumber} вже додана.`
			);
		}

		const id = await addTaskCard(
			gameId,
			cardNumber
		);

		newCard = {
			id,
			game_id: gameId,
			card_number: cardNumber,
			done: 0,
		};
	});

	return newCard;
};

export const removeTaskCardFromDeck = async (
	gameId: number,
	cardId: number
): Promise<void> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(cardId) || cardId <= 0) {
		throw new Error('Некоректний ID картки.');
	}

	await runInTransaction(async () => {
		await requireGame(gameId);

		await requireTaskCard(
			gameId,
			cardId
		);

		await deleteTaskCard(
			gameId,
			cardId
		);
	});
};

export const setTaskCardDone = async (
	gameId: number,
	cardId: number,
	done: 0 | 1
): Promise<TaskCard> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	if (!Number.isInteger(cardId) || cardId <= 0) {
		throw new Error('Некоректний ID картки.');
	}

	let updatedCard: TaskCard;

	await runInTransaction(async () => {
		await requireGame(gameId);

		const card = await requireTaskCard(
			gameId,
			cardId
		);

		if (card.done === done) {
			updatedCard = card;
			return;
		}

		await updateTaskCardDone(
			gameId,
			cardId,
			done
		);

		updatedCard = {
			...card,
			done,
		};
	});

	return updatedCard!;
};

// ============================================================
// LOAD GAME SCREEN
// ============================================================

export const getLoadGameScreen =
	async (): Promise<LoadGameScreenData> => {
		const games = await getSavedGames();

		return {
			games,
		};
	};


// ============================================================
// EDIT PLAYER SCREEN
// ============================================================

export async function getEditPlayersScreen(
	gameId: number
): Promise<EditPlayersScreenData> {
	if (
		!Number.isInteger(gameId) ||
		gameId <= 0
	) {
		throw new Error(
			'Некоректний ID гри.'
		);
	}

	await requireGame(gameId);

	const [
		players,
		characters,
		characterNames,
	] = await Promise.all([
		getPlayers(gameId),
		getCharacters(gameId),
		getPlayableCharacterNames(),
	]);

	return {
		players: players.map((player) => ({
			id: player.id,
			name: player.name,
			team_tokens: player.team_tokens,
			ability_card_id_1:
				player.ability_card_id_1,
			ability_card_id_2:
				player.ability_card_id_2,
			ability_card_id_3:
				player.ability_card_id_3,
		})),

		characters: characters.map((character) => ({
			id: character.id,
			character_name_id:
				character.character_name_id,
			player_id: character.player_id,
		})),

		characterNames: characterNames.map(
			(character) => ({
				id: character.id,
				name: character.name,
			})
		),
	};
}


// ============================================================
// LAYOUT GAME SCREEN
// ============================================================

export const getLayoutGameScreen = async (
	gameId: number
): Promise<LayoutGameScreenData> => {
	if (!Number.isInteger(gameId) || gameId <= 0) {
		throw new Error('Некоректний ID гри.');
	}

	const game = await requireGame(gameId);

	const [
		players,
		ship,
		goods,
		chestGoods,
		adventureCards,
		characters,
		abilityCards,
		experienceCards,
		taskCards,
		eventCards,
		eventDeck,
	] = await Promise.all([
		getPlayers(gameId),
		getShip(gameId),
		getGoods(),
		getChestGoods(gameId),
		getAdventureCards(gameId),
		getCharactersWithNames(gameId),
		getAbilityCards(),
		getAllExperienceCards(),
		getTaskCards(gameId),
		getEventCards(),
		getEventDeck(gameId),
	]);

	const chestState = new Map(
		chestGoods.map((item) => [
			item.goods_id,
			item.activated === 1,
		])
	);

	const chestUnifiedGoods = goods
		.filter((good) => chestState.has(good.id))
		.map((good) => ({
			id: good.id,
			name: good.name,
			type: good.type,
			activated: chestState.get(good.id) ?? false,
			isTotem: good.type
				.toLowerCase()
				.includes('тотем'),
			source: 'chest' as const,
		}));

	const adventureUnifiedGoods = adventureCards.map((card) => ({
		id: card.id,
		name: card.name,
		type: card.type,
		activated: card.activated === 1,
		isTotem: card.totem === 1,
		source: 'adventure' as const,
	}));

	const eventCardsWithOrder = eventDeck
		.map((deckCard) => {
			const eventCard = eventCards.find(
				(card) => card.id === deckCard.event_card_id
			);

			if (!eventCard) {
				return null;
			}

			return {
				id: deckCard.id,
				name: eventCard.name,
				type: eventCard.type,
				property_constantly: eventCard.property_constantly,
				order_number: deckCard.order_number,
				remains_in_game: deckCard.remains_in_game,
			};
		})
		.filter(
			(
				card
			): card is {
				id: number;
				name: string;
				type: string;
				property_constantly: string | number | boolean;
				order_number: number;
				remains_in_game: number;
			} => card !== null
		);

	return {
		game: {
			id: game.id,
			game_name: game.game_name,
			number_of_players: game.number_of_players,
			difficulty_level: game.difficulty_level,
			experience: game.experience,
			number_of_losses: game.number_of_losses,
			win: game.win,
			current_player_id: game.current_player_id,
		},

		players: players.map((player) => ({
			id: player.id,
			name: player.name,
			team_tokens: player.team_tokens,
			ability_card_id_1: player.ability_card_id_1,
			ability_card_id_2: player.ability_card_id_2,
			ability_card_id_3: player.ability_card_id_3,
		})),

		ship,

		allGoods: [
			...chestUnifiedGoods,
			...adventureUnifiedGoods,
		],

		characters,
		abilityCards,
		experienceCards,
		taskCards,

		eventCards: eventCardsWithOrder,
	};
};