// ==================== СТАТИЧНІ ТАБЛИЦІ ====================

export interface CharacterName {
	id: number;
	name: string;
}

export interface AbilityCard {
	id: number;
	name: string;
}

export interface Good {
	id: number;
	name: string;
	type: string; // наприклад, 'food', 'material', 'artifact'
}

export interface EventCard {
	id: number;
	name: string;
	type: string;
	property_constantly: string; // або boolean, залежить від вашої гри
}

export interface ExperienceCard {
	id: number;
	name: string;
	character_name_id: number; // посилання на character_names
}

// ==================== ЗМІННІ ТАБЛИЦІ ====================

export interface Game {
	id: number;
	game_name: string;
	game_date: string; // ISO-дата
	number_of_players: number;
	difficulty_level: number;
	number_of_losses: number;
	experience: number;
	win: number; // 0 або 1
}

export interface Player {
	id: number;
	game_id: number;
	name: string;
	team_tokens: number;
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;
	captain: number; // 0 або 1
}

export interface Character {
	id: number;
	game_id: number;
	player_id: number;
	character_name_id: number;
	damage: number;
	fatigue: number;
	fright: number;
	madness: number;
	poisoning: number;
	weakness: number;
	low_morale: number;
	experience_card_id_1: number | null;
	experience_card_id_2: number | null;
	experience_card_id_3: number | null;
}

export interface Ship {
	id: number;
	game_id: number;
	hull: number;
	deck: number;
	hospital: number;
	caboose: number;
	cabin: number;
	bridge: number;
	last_action: string;
	page: number;
	location: string;
	meat: number;
	vegetables: number;
	grain: number;
	materials: number;
	artifacts: number;
	coins: number;
}

export interface ChestGood {
	id: number;
	game_id: number;
	goods_id: number;
}

export interface EventDeck {
	id: number;
	game_id: number;
	event_card_id: number;
	remains_in_game: number; // 0 або 1
}

export interface TaskDeck {
	id: number;
	game_id: number;
	card_number: number;
	done: number; // 0 або 1
}

export interface AdventureDeck {
	id: number;
	game_id: number;
	card_number: number;
	totem: string; // або number, залежить від гри
}