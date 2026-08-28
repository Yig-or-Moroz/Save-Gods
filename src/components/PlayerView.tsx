import React, { useState, useEffect } from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { db } from '../database';
import CharacterView from './CharacterView';

import CommandTokenBackgroundImage from '../../assets/images/command-token.webp';

type PlayerData = {
	id: number;
	game_id: number;
	name: string;
	team_tokens: number;
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;
	captain: number;
};

type CharacterData = {
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
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	experience_card_id_1: number | null;
	experience_card_id_2: number | null;
	experience_card_id_3: number | null;
};

type AbilityCard = {
	id: number;
	name: string;
};

type ExperienceCard = {
	id: number;
	name: string;
	character_name_id: number;
};

type Props = {
	playerId: number;
	gameId: number;
	abilityCards: AbilityCard[];
	experienceCards: ExperienceCard[];
};

const PlayerView = ({ playerId, gameId, abilityCards, experienceCards }: Props) => {
	const [isLoading, setIsLoading] = useState(true);
	const [player, setPlayer] = useState<PlayerData | null>(null);
	const [characters, setCharacters] = useState<CharacterData[]>([]);
	const [characterNames, setCharacterNames] = useState<{ [key: number]: string }>({});

	useEffect(() => {
		loadPlayerData();
	}, [playerId]);

	const loadPlayerData = async () => {
		try {
			const playerResult = await db.getAllAsync<PlayerData>(
				'SELECT * FROM players WHERE id = ?;',
				[playerId]
			);
			if (playerResult.length === 0) {
				console.error('Гравця не знайдено');
				setIsLoading(false);
				return;
			}
			setPlayer(playerResult[0]);

			const charactersResult = await db.getAllAsync<CharacterData>(
				'SELECT * FROM characters WHERE player_id = ?;',
				[playerId]
			);
			setCharacters(charactersResult);

			if (charactersResult.length > 0) {
				const nameIds = charactersResult.map(c => c.character_name_id).join(',');
				const namesResult = await db.getAllAsync<{ id: number; name: string }>(
					`SELECT id, name FROM character_names WHERE id IN (${nameIds});`
				);
				const namesMap: { [key: number]: string } = {};
				namesResult.forEach(item => {
					namesMap[item.id] = item.name;
				});
				setCharacterNames(namesMap);
			}
		} catch (error) {
			console.error('Помилка завантаження даних гравця:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const getAbilityName = (id: number | null) => {
		if (!id) return null;
		const card = abilityCards.find((c) => c.id === id);
		return card ? card.name : null;
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="small" color="#004d57" />
				<Text style={styles.loadingText}>Завантаження гравця...</Text>
			</View>
		);
	}

	if (!player) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>Дані гравця відсутні</Text>
			</View>
		);
	}

	const abilityNames = [
		getAbilityName(player.ability_card_id_1),
		getAbilityName(player.ability_card_id_2),
		getAbilityName(player.ability_card_id_3),
	].filter(Boolean);

	return (
		<View style={styles.container}>
			{/* Team Tokens (якщо > 0) */}
			{player.team_tokens > 0 && (
				<View style={styles.tokensContainer}>
					<ImageBackground
						source={CommandTokenBackgroundImage}
						style={styles.tokenBackground}
						resizeMode="contain"
					>
						<Text style={styles.tokenText}>{player.team_tokens}</Text>
					</ImageBackground>
				</View>
			)}

			{/* Картки здібностей гравця */}
			{abilityNames.length > 0 && (
				<View style={styles.section}>
					{abilityNames.map((name, index) => (
						<Text key={index} style={styles.listItem}>
							<View style={styles.abilityCard}></View> {name}
						</Text>
					))}
				</View>
			)}

			{/* Персонажі гравця */}
			{characters.length > 0 ? (
				characters.map((char) => {
					const charName = characterNames[char.character_name_id] || 'Невідомий персонаж';
					return (
						<View key={char.id} style={styles.characterBlock}>
							<Text style={styles.characterName}>{charName}</Text>
							<CharacterView
								character={char}
								characterName={charName}
								abilityCards={abilityCards}
								experienceCards={experienceCards}
							/>
						</View>
					);
				})
			) : (
				<Text style={styles.noCharacters}>У гравця немає персонажів</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f5f0e8',
		paddingVertical: 16,
		borderRadius: 8,
	},
	loadingContainer: {
		padding: 20,
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 8,
		fontSize: 14,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	errorContainer: {
		padding: 20,
		alignItems: 'center',
	},
	errorText: {
		fontSize: 16,
		color: '#691716',
		fontFamily: 'Kyiv-Machine',
	},
	tokensContainer: {
		alignItems: 'center',
		marginBottom: 12,
	},
	tokenBackground: {
		width: 70,
		height: 70,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tokenText: {
		fontSize: 46,
		fontFamily: 'Kyiv-Machine',
		color: '#fff',
		marginBottom: 16,
		textShadowColor: '#000',
		textShadowOffset: { width: 2, height: 0 },
		textShadowRadius: 3,
	},
	section: {
		marginTop: 8,
		marginLeft: 16,
	},
	listItem: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#630606',
		marginLeft: 8,
		alignItems: 'center',
	},
	abilityCard: {
		width: 18,
		height: 22,
		backgroundColor: "#630606",
		borderRadius: 3,
		borderWidth: 1,
		borderColor: '#ba5740',
	},
	characterBlock: {
		marginTop: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#ccc',
	},
	characterName: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 12,
		textAlign: 'center',
	},
	noCharacters: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
		textAlign: 'center',
		marginTop: 8,
	},
});

export default PlayerView;