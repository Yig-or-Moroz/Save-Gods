import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCharacterNames, db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';

type Character = {
	id: number;
	name: string;
};

type CharacterFull = {
	id: number;
	character_name_id: number;
	player_id: number | null;
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

type Player = {
	id: number;
	name: string;
	team_tokens: number;
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;
	captain: number;
};

const EditPlayersScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [allCharacters, setAllCharacters] = useState<Character[]>([]);
	const [players, setPlayers] = useState<Player[]>([]);
	const [characters, setCharacters] = useState<CharacterFull[]>([]);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const data = await getCharacterNames();
			const filtered = data.filter((c) => c.id !== 1);
			setAllCharacters(filtered);

			const playersResult = await db.getAllAsync<{
				id: number;
				name: string;
				team_tokens: number;
				ability_card_id_1: number | null;
				ability_card_id_2: number | null;
				ability_card_id_3: number | null;
				captain: number;
			}>(
				'SELECT id, name, team_tokens, ability_card_id_1, ability_card_id_2, ability_card_id_3, captain FROM players WHERE game_id = ? ORDER BY id;',
				[gameId]
			);
			setPlayers(playersResult);

			const charsResult = await db.getAllAsync<CharacterFull>(
				`SELECT 
          id, character_name_id, player_id,
          damage, fatigue, fright, madness, poisoning, weakness, low_morale,
          ability_card_id_1, ability_card_id_2,
          experience_card_id_1, experience_card_id_2, experience_card_id_3
        FROM characters 
        WHERE game_id = ? AND character_name_id != 1
        ORDER BY character_name_id;`,
				[gameId]
			);
			setCharacters(charsResult);
		} catch (error) {
			console.error('Помилка завантаження даних:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити дані');
		} finally {
			setIsLoading(false);
		}
	};

	const addPlayer = () => {
		if (players.length >= 4) {
			Alert.alert('Увага', 'Максимум 4 гравці');
			return;
		}
		const newPlayer: Player = {
			id: -1,
			name: '',
			team_tokens: 0,
			ability_card_id_1: null,
			ability_card_id_2: null,
			ability_card_id_3: null,
			captain: 0,
		};
		setPlayers([...players, newPlayer]);
	};

	const removePlayer = () => {
		if (players.length <= 1) {
			Alert.alert('Увага', 'Повинен бути хоча б один гравець');
			return;
		}
		const options = [
			...players.map((p, index) => ({
				text: `${index + 1}. ${p.name || 'Без імені'}`,
				style: 'default' as const,
				onPress: () => confirmRemovePlayer(index),
			})),
			{
				text: 'Скасувати',
				style: 'cancel' as const,
				onPress: () => { },
			},
		];
		Alert.alert('Видалення гравця', 'Оберіть гравця, якого потрібно видалити:', options);
	};

	const confirmRemovePlayer = (indexToRemove: number) => {
		const removedPlayer = players[indexToRemove];
		if (!removedPlayer) return;

		Alert.alert(
			'Підтвердження',
			`Ви впевнені, що хочете видалити гравця "${removedPlayer.name || 'Без імені'}"? Його персонажі стануть безхазяйними і їх можна буде призначити іншим гравцям.`,
			[
				{ text: 'Скасувати', style: 'cancel' as const, onPress: () => { } },
				{
					text: 'Видалити',
					style: 'destructive' as const,
					onPress: () => {
						const updatedPlayers = [...players];
						const removed = updatedPlayers.splice(indexToRemove, 1);
						const updatedCharacters = characters.map((c) => {
							if (c.player_id === removed[0].id) {
								return { ...c, player_id: null };
							}
							return c;
						});
						setPlayers(updatedPlayers);
						setCharacters(updatedCharacters);
					},
				},
			]
		);
	};

	const toggleCharacter = (playerId: number, characterId: number) => {
		const charIndex = characters.findIndex(
			(c) => c.character_name_id === characterId
		);
		if (charIndex === -1) return;

		const char = characters[charIndex];
		if (char.player_id === playerId) {
			const updated = [...characters];
			updated[charIndex] = { ...char, player_id: null };
			setCharacters(updated);
			return;
		}
		const updated = characters.map((c) => {
			if (c.character_name_id === characterId) {
				return { ...c, player_id: playerId };
			}
			return c;
		});
		setCharacters(updated);
	};

	const getPlayerCharacters = (playerId: number) => {
		return characters.filter((c) => c.player_id === playerId);
	};

	const handleSave = async () => {
		const emptyName = players.some((p) => !p.name.trim());
		if (emptyName) {
			Alert.alert('Помилка', 'Всі гравці повинні мати імена');
			return;
		}
		const unassigned = characters.filter((c) => c.player_id === null);
		if (unassigned.length > 0) {
			Alert.alert('Помилка', 'Всі персонажі повинні бути розподілені між гравцями');
			return;
		}
		for (const player of players) {
			const hasChars = characters.some((c) => c.player_id === player.id);
			if (!hasChars) {
				Alert.alert('Помилка', `Гравець "${player.name}" не має жодного персонажа`);
				return;
			}
		}

		try {
			await db.runAsync('DELETE FROM players WHERE game_id = ?;', [gameId]);
			await db.runAsync('DELETE FROM characters WHERE game_id = ? AND player_id != 0;', [gameId]);

			const oldToNewId: { [key: number]: number } = {};
			for (const player of players) {
				const result = await db.runAsync(
					`INSERT INTO players (game_id, name, team_tokens, ability_card_id_1, ability_card_id_2, ability_card_id_3, captain)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
					[
						gameId,
						player.name.trim(),
						player.team_tokens || 0,
						player.ability_card_id_1 || null,
						player.ability_card_id_2 || null,
						player.ability_card_id_3 || null,
						player.captain || 0,
					]
				);
				oldToNewId[player.id] = result.lastInsertRowId;
			}

			for (const char of characters) {
				const newPlayerId = oldToNewId[char.player_id!];
				if (newPlayerId === undefined) {
					console.error('Не знайдено новий player_id для', char.player_id);
					continue;
				}
				await db.runAsync(
					`INSERT INTO characters (
            game_id, player_id, character_name_id,
            damage, fatigue, fright, madness, poisoning, weakness, low_morale,
            ability_card_id_1, ability_card_id_2,
            experience_card_id_1, experience_card_id_2, experience_card_id_3
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
					[
						gameId,
						newPlayerId,
						char.character_name_id,
						char.damage || 0,
						char.fatigue || 0,
						char.fright || 0,
						char.madness || 0,
						char.poisoning || 0,
						char.weakness || 0,
						char.low_morale || 0,
						char.ability_card_id_1 || null,
						char.ability_card_id_2 || null,
						char.experience_card_id_1 || null,
						char.experience_card_id_2 || null,
						char.experience_card_id_3 || null,
					]
				);
			}

			Alert.alert('Успіх', 'Зміни збережено!', [
				{ text: 'ОК', onPress: () => navigation.goBack() },
			]);
		} catch (error) {
			console.error('Помилка збереження:', error);
			Alert.alert('Помилка', 'Не вдалося зберегти зміни');
		}
	};

	const isCharacterAvailable = (playerId: number, characterId: number): boolean => {
		const char = characters.find((c) => c.character_name_id === characterId);
		if (!char) return false;
		return char.player_id === null || char.player_id === playerId;
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#004d57" />
				<Text style={styles.loadingText}>Завантаження...</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerWrapper}>
				<View style={styles.backButtonWrapper}>
					<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
						<Ionicons name="arrow-back" size={22} color="#004d57" />
					</TouchableOpacity>
				</View>
				<View style={styles.titleWrapper}>
					<Text style={styles.header}>Змінити гравців</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.field}>
					<Text style={styles.label}>Кількість гравців</Text>
					<View style={styles.radioGroup}>
						<TouchableOpacity style={styles.radioButton} onPress={removePlayer}>
							<Text style={styles.radioText}>➖</Text>
						</TouchableOpacity>
						<Text style={styles.counterText}>{players.length}</Text>
						<TouchableOpacity style={styles.radioButton} onPress={addPlayer}>
							<Text style={styles.radioText}>➕</Text>
						</TouchableOpacity>
					</View>
				</View>

				{players.map((player, index) => {
					const playerChars = getPlayerCharacters(player.id);
					return (
						<View key={index} style={styles.playerBlock}>
							<Text style={styles.playerTitle}>
								{index === 0 ? 'Перший' : index === 1 ? 'Другий' : index === 2 ? 'Третій' : 'Четвертий'} гравець
							</Text>
							<TextInput
								style={styles.input}
								value={player.name}
								onChangeText={(text) => {
									const updated = [...players];
									updated[index].name = text;
									setPlayers(updated);
								}}
								placeholder="Ім'я гравця"
							/>
							<View style={styles.checkboxGroup}>
								{allCharacters.map((char) => {
									const available = isCharacterAvailable(player.id, char.id);
									const isSelected = playerChars.some(
										(c) => c.character_name_id === char.id
									);
									return (
										<TouchableOpacity
											key={char.id}
											style={[
												styles.checkboxRow,
												!available && styles.checkboxRowDisabled,
											]}
											onPress={() => available && toggleCharacter(player.id, char.id)}
											activeOpacity={available ? 0.7 : 1}
											disabled={!available}
										>
											<View
												style={[
													styles.checkbox,
													isSelected && styles.checkboxChecked,
													!available && styles.checkboxDisabled,
												]}
											/>
											<Text
												style={[
													styles.checkboxLabel,
													!available && styles.checkboxLabelDisabled,
												]}
											>
												{char.name}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
					);
				})}

				<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
					<Text style={styles.saveButtonText}>Зберегти</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f0e8',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f0e8',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 18,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	headerWrapper: {
		flexDirection: 'column',
		width: '100%',
		paddingHorizontal: 16,
		paddingTop: 16,
		backgroundColor: '#f5f0e8',
		borderBottomWidth: 1,
		borderBottomColor: '#004d57',
	},
	backButtonWrapper: {
		alignSelf: 'flex-start',
		marginBottom: 8,
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: '#004d57',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
	},
	titleWrapper: {
		alignSelf: 'center',
		width: '100%',
		marginBottom: 16,
	},
	header: {
		fontSize: 28,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		textAlign: 'center',
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	field: {
		marginBottom: 20,
	},
	label: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: '#fff',
	},
	radioGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	radioButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 2,
		borderColor: '#004d57',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
	},
	radioText: {
		fontSize: 24,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	counterText: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: '#004d57',
		textAlign: 'center',
		textAlignVertical: 'center',
		fontSize: 25,
		color: '#fff',
		fontFamily: 'Kyiv-Machine',
	},
	playerBlock: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	playerTitle: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 10,
	},
	checkboxGroup: {
		marginTop: 8,
	},
	checkboxRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 4,
	},
	checkboxRowDisabled: {
		opacity: 0.4,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#004d57',
		marginRight: 10,
		backgroundColor: '#fff',
	},
	checkboxChecked: {
		backgroundColor: '#004d57',
	},
	checkboxDisabled: {
		borderColor: '#aaa',
		backgroundColor: '#eee',
	},
	checkboxLabel: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	checkboxLabelDisabled: {
		color: '#aaa',
	},
	saveButton: {
		backgroundColor: '#691716',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 20,
	},
	saveButtonText: {
		fontSize: 20,
		color: '#fff',
		fontFamily: 'Kyiv-Machine',
		letterSpacing: 1,
	},
});

export default EditPlayersScreen;