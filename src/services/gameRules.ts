// src/services/gameRules.ts

/**
 * ============================================================
 * GAME RULES
 * ============================================================
 *
 * У грі:
 * - 9 персонажів загалом;
 * - персонаж №1 — Капітан Софі Одеса;
 * - Софі не належить жодному гравцю;
 * - інші 8 персонажів розподіляються між 1–4 гравцями.
 *
 * Розподіл:
 * 1 гравець → 8
 * 2 гравці → 4 / 4
 * 3 гравці → 3 / 3 / 2
 * 4 гравці → 2 / 2 / 2 / 2
 */

/* ============================================================
   CONSTANTS
   ============================================================ */

/**
 * ID Капітана Софі Одеса у character_names.
 */
export const SOPHIE_CHARACTER_ID = 1;

/**
 * Загальна кількість персонажів у грі.
 */
export const TOTAL_CHARACTER_COUNT = 9;

/**
 * Кількість персонажів, які розподіляються між гравцями.
 *
 * Софі не входить до цього числа.
 */
export const PLAYER_CHARACTER_COUNT = 8;

/**
 * Мінімальна кількість гравців.
 */
export const MIN_PLAYERS = 1;

/**
 * Максимальна кількість гравців.
 */
export const MAX_PLAYERS = 4;

/**
 * Рівні складності.
 */
export const DIFFICULTY_NORMAL = 1;
export const DIFFICULTY_HARD = 2;

/**
 * Допустимі рівні складності.
 */
export const DIFFICULTY_LEVELS = [
  DIFFICULTY_NORMAL,
  DIFFICULTY_HARD,
] as const;

/**
 * ID, які використовуються UI для нових,
 * ще не збережених гравців.
 *
 * Наприклад:
 * -1
 * -2
 * -3
 */
export const TEMPORARY_PLAYER_ID_MAX = -1;

/* ============================================================
   TYPES
   ============================================================ */

export type DifficultyLevel =
  | typeof DIFFICULTY_NORMAL
  | typeof DIFFICULTY_HARD;

export type PlayerCharacterDistribution = {
  playerId: number;
  characterIds: number[];
};

/* ============================================================
   PLAYER COUNT
   ============================================================ */

/**
 * Перевіряє допустиму кількість гравців.
 */
export function validatePlayerCount(playerCount: number): void {
  if (!Number.isInteger(playerCount)) {
    throw new Error('Кількість гравців повинна бути цілим числом.');
  }

  if (
    playerCount < MIN_PLAYERS ||
    playerCount > MAX_PLAYERS
  ) {
    throw new Error(
      `Кількість гравців повинна бути від ${MIN_PLAYERS} до ${MAX_PLAYERS}.`
    );
  }
}

/**
 * Повертає правильний розподіл персонажів
 * для заданої кількості гравців.
 *
 * Приклади:
 *
 * 1 → [8]
 * 2 → [4, 4]
 * 3 → [3, 3, 2]
 * 4 → [2, 2, 2, 2]
 */
export function getCharacterDistribution(
  playerCount: number
): number[] {
  validatePlayerCount(playerCount);

  switch (playerCount) {
    case 1:
      return [8];

    case 2:
      return [4, 4];

    case 3:
      return [3, 3, 2];

    case 4:
      return [2, 2, 2, 2];

    default:
      // validatePlayerCount() вже гарантує,
      // що сюди не потрапимо.
      throw new Error('Недопустима кількість гравців.');
  }
}

/**
 * Повертає кількість персонажів,
 * яку повинен мати кожен гравець,
 * з урахуванням конкретного індексу.
 *
 * Для 3 гравців:
 * playerIndex 0 → 3
 * playerIndex 1 → 3
 * playerIndex 2 → 2
 */
export function getCharacterCountForPlayer(
  playerCount: number,
  playerIndex: number
): number {
  const distribution = getCharacterDistribution(playerCount);

  if (
    !Number.isInteger(playerIndex) ||
    playerIndex < 0 ||
    playerIndex >= distribution.length
  ) {
    throw new Error('Недопустимий індекс гравця.');
  }

  return distribution[playerIndex];
}

/* ============================================================
   CHARACTER DISTRIBUTION VALIDATION
   ============================================================ */

/**
 * Перевіряє точний розподіл персонажів між гравцями.
 *
 * ВАЖЛИВО:
 * Для 3 гравців дозволені будь-які перестановки:
 *
 * 3 / 3 / 2
 * 3 / 2 / 3
 * 2 / 3 / 3
 *
 * Тобто порядок гравців не має значення.
 */
export function validateExactCharacterDistribution(
  playerCount: number,
  assignments: PlayerCharacterDistribution[]
): void {
  validatePlayerCount(playerCount);

  if (assignments.length !== playerCount) {
    throw new Error(
      `Очікується ${playerCount} гравців, отримано ${assignments.length}.`
    );
  }

  const expectedDistribution = getCharacterDistribution(playerCount)
    .slice()
    .sort((a, b) => a - b);

  const actualDistribution = assignments
    .map((assignment) => assignment.characterIds.length)
    .sort((a, b) => a - b);

  if (
    expectedDistribution.length !== actualDistribution.length ||
    expectedDistribution.some(
      (count, index) => count !== actualDistribution[index]
    )
  ) {
    throw new Error(
      `Неправильний розподіл персонажів. ` +
      `Для ${playerCount} гравців дозволено: ` +
      `${getCharacterDistribution(playerCount).join(' / ')}.`
    );
  }
}

/**
 * Повна перевірка розподілу персонажів.
 *
 * Перевіряє:
 * - правильну кількість гравців;
 * - правильну кількість персонажів;
 * - відсутність Софі серед персонажів гравців;
 * - відсутність дублювання персонажів;
 * - валідні character ID;
 * - точний розподіл 8 персонажів.
 */
export function validateCharacterDistribution(
  playerCount: number,
  assignments: PlayerCharacterDistribution[]
): void {
  validateExactCharacterDistribution(
    playerCount,
    assignments
  );

  const allCharacterIds: number[] = [];

  for (const assignment of assignments) {
    if (!Number.isInteger(assignment.playerId)) {
      throw new Error('ID гравця повинен бути цілим числом.');
    }

    for (const characterId of assignment.characterIds) {
      if (!Number.isInteger(characterId)) {
        throw new Error(
          'ID персонажа повинен бути цілим числом.'
        );
      }

      if (characterId === SOPHIE_CHARACTER_ID) {
        throw new Error(
          'Капітан Софі Одеса не може бути призначена гравцю.'
        );
      }

      if (
        characterId < 1 ||
        characterId > TOTAL_CHARACTER_COUNT
      ) {
        throw new Error(
          `Недопустимий ID персонажа: ${characterId}.`
        );
      }

      allCharacterIds.push(characterId);
    }
  }

  if (allCharacterIds.length !== PLAYER_CHARACTER_COUNT) {
    throw new Error(
      `Гравці повинні мати загалом ${PLAYER_CHARACTER_COUNT} персонажів.`
    );
  }

  const uniqueCharacterIds = new Set(allCharacterIds);

  if (uniqueCharacterIds.size !== allCharacterIds.length) {
    throw new Error(
      'Один і той самий персонаж не може бути призначений кільком гравцям.'
    );
  }

  /**
   * Очікуємо рівно персонажів 2–9.
   * Персонаж №1 — Софі — тут відсутній навмисно.
   */
  for (
    let characterId = 2;
    characterId <= TOTAL_CHARACTER_COUNT;
    characterId++
  ) {
    if (!uniqueCharacterIds.has(characterId)) {
      throw new Error(
        `Персонаж з ID ${characterId} не призначений жодному гравцю.`
      );
    }
  }
}

/* ============================================================
   GAME CHARACTERS
   ============================================================ */

/**
 * Перевіряє повний набір персонажів гри.
 *
 * У грі повинно бути:
 * - рівно 9 персонажів;
 * - рівно одна Софі;
 * - character IDs 1–9;
 * - Софі без player_id;
 * - всі інші з player_id.
 */
export type GameCharacterForValidation = {
  id: number;
  character_name_id: number;
  player_id: number | null;
};

export function validateGameCharacters(
  characters: GameCharacterForValidation[]
): void {
  if (characters.length !== TOTAL_CHARACTER_COUNT) {
    throw new Error(
      `У грі повинно бути рівно ${TOTAL_CHARACTER_COUNT} персонажів.`
    );
  }

  const characterNameIds = characters.map(
    (character) => character.character_name_id
  );

  const uniqueCharacterNameIds = new Set(characterNameIds);

  if (
    uniqueCharacterNameIds.size !== TOTAL_CHARACTER_COUNT
  ) {
    throw new Error(
      'У грі не може бути дубльованих типів персонажів.'
    );
  }

  for (
    let characterId = 1;
    characterId <= TOTAL_CHARACTER_COUNT;
    characterId++
  ) {
    if (!uniqueCharacterNameIds.has(characterId)) {
      throw new Error(
        `У грі відсутній персонаж з ID ${characterId}.`
      );
    }
  }

  const sophieCharacters = characters.filter(
    (character) =>
      character.character_name_id === SOPHIE_CHARACTER_ID
  );

  if (sophieCharacters.length !== 1) {
    throw new Error(
      'У грі повинна бути рівно одна Капітан Софі Одеса.'
    );
  }

  const sophie = sophieCharacters[0];

  if (sophie.player_id !== null) {
    throw new Error(
      'Капітан Софі Одеса не може належати гравцю.'
    );
  }

  const playerCharacters = characters.filter(
    (character) =>
      character.character_name_id !== SOPHIE_CHARACTER_ID
  );

  for (const character of playerCharacters) {
    if (character.player_id === null) {
      throw new Error(
        `Персонаж ${character.character_name_id} не має гравця.`
      );
    }
  }
}

/* ============================================================
   GAME NAME
   ============================================================ */

/**
 * Перевіряє назву гри.
 */
export function validateGameName(gameName: string): void {
  if (typeof gameName !== 'string') {
    throw new Error('Назва гри повинна бути текстом.');
  }

  if (gameName.trim().length === 0) {
    throw new Error('Введіть назву гри.');
  }
}

/**
 * Нормалізує назву гри.
 */
export function normalizeGameName(gameName: string): string {
  validateGameName(gameName);

  return gameName.trim();
}

/* ============================================================
   PLAYER NAME
   ============================================================ */

/**
 * Перевіряє ім'я гравця.
 */
export function validatePlayerName(playerName: string): void {
  if (typeof playerName !== 'string') {
    throw new Error('Імʼя гравця повинно бути текстом.');
  }

  if (playerName.trim().length === 0) {
    throw new Error('Імʼя гравця не може бути порожнім.');
  }
}

/**
 * Нормалізує ім'я гравця.
 */
export function normalizePlayerName(playerName: string): string {
  validatePlayerName(playerName);

  return playerName.trim();
}

/**
 * Перевіряє список гравців.
 *
 * Перевіряє:
 * - правильну кількість;
 * - непорожні імена;
 * - відсутність однакових імен.
 */
export function validatePlayers(
  players: Array<{ id: number; name: string }>
): void {
  validatePlayerCount(players.length);

  const names = players.map((player) => {
    validatePlayerName(player.name);
    return player.name.trim().toLocaleLowerCase();
  });

  const uniqueNames = new Set(names);

  if (uniqueNames.size !== names.length) {
    throw new Error(
      'Імена гравців повинні бути унікальними.'
    );
  }

  for (const player of players) {
    if (!Number.isInteger(player.id)) {
      throw new Error(
        'ID гравця повинен бути цілим числом.'
      );
    }
  }
}

/* ============================================================
   DIFFICULTY
   ============================================================ */

/**
 * Перевіряє рівень складності.
 */
export function validateDifficulty(
  difficultyLevel: number
): asserts difficultyLevel is DifficultyLevel {
  if (
    difficultyLevel !== DIFFICULTY_NORMAL &&
    difficultyLevel !== DIFFICULTY_HARD
  ) {
    throw new Error(
      'Недопустимий рівень складності.'
    );
  }
}

/* ============================================================
   TEMPORARY PLAYER IDS
   ============================================================ */

/**
 * Перевіряє, чи є ID тимчасовим ID нового гравця.
 *
 * EditPlayersScreen використовує від'ємні ID:
 *
 * -1
 * -2
 * -3
 *
 * Тому не можна перевіряти тільки `id === -1`.
 */
export function isTemporaryPlayerId(
  playerId: number
): boolean {
  return (
    Number.isInteger(playerId) &&
    playerId < 0
  );
}

/**
 * Перевіряє, чи є ID реальним ID з БД.
 */
export function isPersistedPlayerId(
  playerId: number
): boolean {
  return (
    Number.isInteger(playerId) &&
    playerId > 0
  );
}

/* ============================================================
   CHARACTER IDS
   ============================================================ */

/**
 * Перевіряє ID персонажа.
 */
export function validateCharacterId(
  characterId: number
): void {
  if (!Number.isInteger(characterId)) {
    throw new Error(
      'ID персонажа повинен бути цілим числом.'
    );
  }

  if (
    characterId < 1 ||
    characterId > TOTAL_CHARACTER_COUNT
  ) {
    throw new Error(
      `Недопустимий ID персонажа: ${characterId}.`
    );
  }
}

/**
 * Перевіряє, чи є персонаж Софі.
 */
export function isSophieCharacter(
  characterId: number
): boolean {
  return characterId === SOPHIE_CHARACTER_ID;
}

/**
 * Перевіряє, чи є персонаж звичайним ігровим персонажем,
 * тобто одним із 8 персонажів, які розподіляються між гравцями.
 */
export function isPlayableCharacter(
  characterId: number
): boolean {
  return (
    characterId >= 2 &&
    characterId <= TOTAL_CHARACTER_COUNT
  );
}

/* ============================================================
   PLAYABLE CHARACTER SET
   ============================================================ */

/**
 * Повертає ID всіх 8 персонажів,
 * які можуть бути призначені гравцям.
 *
 * [2, 3, 4, 5, 6, 7, 8, 9]
 */
export function getPlayableCharacterIds(): number[] {
  const result: number[] = [];

  for (
    let id = 1;
    id <= TOTAL_CHARACTER_COUNT;
    id++
  ) {
    if (isPlayableCharacter(id)) {
      result.push(id);
    }
  }

  return result;
}

/**
 * Перевіряє, що передані ID — це повний набір
 * 8 ігрових персонажів.
 */
export function validatePlayableCharacterIds(
  characterIds: number[]
): void {
  if (characterIds.length !== PLAYER_CHARACTER_COUNT) {
    throw new Error(
      `Повинно бути рівно ${PLAYER_CHARACTER_COUNT} ігрових персонажів.`
    );
  }

  const uniqueIds = new Set(characterIds);

  if (uniqueIds.size !== characterIds.length) {
    throw new Error(
      'Серед ігрових персонажів не може бути дублювань.'
    );
  }

  for (const characterId of characterIds) {
    if (!isPlayableCharacter(characterId)) {
      throw new Error(
        `Персонаж ${characterId} не може бути призначений гравцю.`
      );
    }
  }

  const expectedIds = getPlayableCharacterIds();

  for (const expectedId of expectedIds) {
    if (!uniqueIds.has(expectedId)) {
      throw new Error(
        `Відсутній персонаж з ID ${expectedId}.`
      );
    }
  }
}

/* ============================================================
   GAME STATE
   ============================================================ */

/**
 * Перевіряє кількість програних раундів/втрат.
 */
export function validateNumberOfLosses(
  numberOfLosses: number
): void {
  if (!Number.isInteger(numberOfLosses)) {
    throw new Error(
      'Кількість втрат повинна бути цілим числом.'
    );
  }

  if (numberOfLosses < 0) {
    throw new Error(
      'Кількість втрат не може бути відʼємною.'
    );
  }
}

/**
 * Перевіряє досвід гри.
 */
export function validateExperience(
  experience: number
): void {
  if (!Number.isInteger(experience)) {
    throw new Error(
      'Досвід повинен бути цілим числом.'
    );
  }

  if (experience < 0) {
    throw new Error(
      'Досвід не може бути відʼємним.'
    );
  }
}

/**
 * Перевіряє прапорець перемоги.
 */
export function validateWin(win: number): void {
  if (win !== 0 && win !== 1) {
    throw new Error(
      'Значення перемоги повинно бути 0 або 1.'
    );
  }
}

/* ============================================================
   CURRENT PLAYER
   ============================================================ */

/**
 * Перевіряє ID поточного гравця.
 *
 * null дозволений, наприклад під час створення/видалення.
 */
export function validateCurrentPlayerId(
  playerId: number | null
): void {
  if (playerId === null) {
    return;
  }

  if (!Number.isInteger(playerId)) {
    throw new Error(
      'ID поточного гравця повинен бути цілим числом або null.'
    );
  }

  if (playerId <= 0) {
    throw new Error(
      'ID поточного гравця повинен бути додатним.'
    );
  }
}

/* ============================================================
   FULL NEW GAME VALIDATION
   ============================================================ */

export type NewGameValidationInput = {
  gameName: string;
  playerCount: number;
  difficultyLevel: number;
  players: Array<{
    id: number;
    name: string;
    characterIds: number[];
  }>;
};

/**
 * Повна бізнес-перевірка нової гри.
 *
 * Цю функцію може викликати gameService перед
 * початком transaction.
 */
export function validateNewGame(
  input: NewGameValidationInput
): void {
  validateGameName(input.gameName);

  validatePlayerCount(input.playerCount);

  validateDifficulty(input.difficultyLevel);

  if (input.players.length !== input.playerCount) {
    throw new Error(
      `Кількість гравців повинна дорівнювати ${input.playerCount}.`
    );
  }

  validatePlayers(
    input.players.map((player) => ({
      id: player.id,
      name: player.name,
    }))
  );

  const assignments: PlayerCharacterDistribution[] =
    input.players.map((player) => ({
      playerId: player.id,
      characterIds: player.characterIds,
    }));

  validateCharacterDistribution(
    input.playerCount,
    assignments
  );
}

/* ============================================================
   EDIT GAME VALIDATION
   ============================================================ */

export type EditablePlayerForValidation = {
  id: number;
  name: string;
};

export type EditableCharacterForValidation = {
  id: number;
  character_name_id: number;
  player_id: number | null;
};

/**
 * Повна перевірка зміни кількості/складу гравців.
 *
 * Важливо:
 * тут можуть бути тимчасові ID нових гравців:
 *
 * -1, -2, -3
 *
 * Це нормально. gameService повинен замінити їх
 * на реальні DB IDs перед записом characters.
 */
export function validateEditedGame(
  players: EditablePlayerForValidation[],
  characters: EditableCharacterForValidation[]
): void {
  validatePlayerCount(players.length);

  validatePlayers(players);

  validateGameCharacters(characters);

  const playerIds = new Set(
    players.map((player) => player.id)
  );

  const assignments: PlayerCharacterDistribution[] =
    players.map((player) => ({
      playerId: player.id,
      characterIds: characters
        .filter(
          (character) =>
            character.character_name_id !==
              SOPHIE_CHARACTER_ID &&
            character.player_id === player.id
        )
        .map(
          (character) => character.character_name_id
        ),
    }));

  /**
   * Перевіряємо, що кожен character.player_id
   * справді належить поточному списку гравців.
   */
  for (const character of characters) {
    if (
      character.character_name_id ===
      SOPHIE_CHARACTER_ID
    ) {
      if (character.player_id !== null) {
        throw new Error(
          'Капітан Софі Одеса не може мати гравця.'
        );
      }

      continue;
    }

    if (
      character.player_id === null ||
      !playerIds.has(character.player_id)
    ) {
      throw new Error(
        `Персонаж ${character.character_name_id} має недопустимого гравця.`
      );
    }
  }

  validateCharacterDistribution(
    players.length,
    assignments
  );
}