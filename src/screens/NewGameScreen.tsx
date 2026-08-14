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

type Player = {
	id: number;
	name: string;
	selectedCharacterIds: number[];
};

const NewGameScreen = ({ navigation }: any) => {
	const [isLoading, setIsLoading] = useState(true);
	const [gameName, setGameName] = useState('');
	const [playerCount, setPlayerCount] = useState(4);
	const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
	const [allCharacters, setAllCharacters] = useState<Character[]>([]);
	const [players, setPlayers] = useState<Player[]>([]);

	useEffect(() => {
		const loadData = async () => {
			try {
				const data = await getCharacterNames();
				// Виключаємо Капітана зі списку для вибору гравцями
				const filtered = data.filter((c) => c.id !== 1);
				setAllCharacters(filtered);
				const initialPlayers: Player[] = Array.from({ length: playerCount }, (_, index) => ({
					id: index,
					name: '',
					selectedCharacterIds: [],
				}));
				// Якщо 1 гравець – призначаємо всіх персонажів (крім Капітана)
				if (playerCount === 1) {
					initialPlayers[0].selectedCharacterIds = filtered.map((c) => c.id);
				}
				setPlayers(initialPlayers);
			} catch (error) {
				console.error('Помилка завантаження персонажів:', error);
				Alert.alert('Помилка', 'Не вдалося завантажити список персонажів');
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

	// Оновлення гравців при зміні кількості гравців
	useEffect(() => {
		if (allCharacters.length === 0) return;
		const newPlayers: Player[] = Array.from({ length: playerCount }, (_, index) => ({
			id: index,
			name: '',
			selectedCharacterIds: [],
		}));
		// Якщо 1 гравець – призначаємо всіх персонажів (крім Капітана)
		if (playerCount === 1) {
			newPlayers[0].selectedCharacterIds = allCharacters.map((c) => c.id);
		}
		setPlayers(newPlayers);
	}, [playerCount, allCharacters]);

	const isCharacterAvailable = (playerIndex: number, characterId: number): boolean => {
		const otherSelected = players
			.filter((_, idx) => idx !== playerIndex)
			.flatMap((p) => p.selectedCharacterIds);
		const currentSelected = players[playerIndex]?.selectedCharacterIds || [];
		return !otherSelected.includes(characterId) || currentSelected.includes(characterId);
	};

	const toggleCharacter = (playerIndex: number, characterId: number) => {
		const updatedPlayers = [...players];
		const player = updatedPlayers[playerIndex];
		const isSelected = player.selectedCharacterIds.includes(characterId);
		if (isSelected) {
			player.selectedCharacterIds = player.selectedCharacterIds.filter(
				(id) => id !== characterId
			);
		} else {
			player.selectedCharacterIds = [...player.selectedCharacterIds, characterId];
		}
		setPlayers(updatedPlayers);
	};

	const handleCreateGame = async () => {
		if (!gameName.trim()) {
			Alert.alert('Помилка', 'Введіть назву гри');
			return;
		}
		const emptyName = players.some((p) => !p.name.trim());
		if (emptyName) {
			Alert.alert('Помилка', 'Всі гравці повинні мати імена');
			return;
		}
		const noCharacter = players.some((p) => p.selectedCharacterIds.length === 0);
		if (noCharacter) {
			Alert.alert('Помилка', 'Кожен гравець повинен обрати хоча б одного персонажа');
			return;
		}

		// Перевірка, чи всі персонажі (крім Капітана) розподілені
		const totalSelected = players.reduce((sum, p) => sum + p.selectedCharacterIds.length, 0);
		if (totalSelected !== allCharacters.length) {
			Alert.alert('Помилка', 'Всі персонажі повинні бути розподілені між гравцями');
			return;
		}

		try {
			const today = new Date().toISOString().split('T')[0];
			const gameResult = await db.runAsync(
				`INSERT INTO games (game_name, game_date, number_of_players, difficulty_level, number_of_losses, experience, win)
         VALUES (?, ?, ?, ?, 0, 0, 0);`,
				[gameName.trim(), today, playerCount, difficulty === 'normal' ? 1 : 2]
			);
			const gameId = gameResult.lastInsertRowId;

			// Додаємо гравців та їхніх персонажів
			for (const player of players) {
				const playerResult = await db.runAsync(
					`INSERT INTO players (game_id, name, team_tokens, ability_card_id_1, ability_card_id_2, ability_card_id_3, captain)
           VALUES (?, ?, 0, NULL, NULL, NULL, 0);`,
					[gameId, player.name.trim()]
				);
				const playerId = playerResult.lastInsertRowId;

				for (const characterId of player.selectedCharacterIds) {
					await db.runAsync(
						`INSERT INTO characters (
							game_id, player_id, character_name_id,
							damage, fatigue, fright, madness, poisoning, weakness, low_morale,
							ability_card_id_1, ability_card_id_2,
							experience_card_id_1, experience_card_id_2, experience_card_id_3
						) VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL);`,
						[gameId, playerId, characterId]
					);
				}
			}

			// Додаємо загального персонажа – Капітана Софі Одеса (id=1) з player_id = 0
			await db.runAsync(
				`INSERT INTO characters (
					game_id, player_id, character_name_id,
					damage, fatigue, fright, madness, poisoning, weakness, low_morale,
					ability_card_id_1, ability_card_id_2,
					experience_card_id_1, experience_card_id_2, experience_card_id_3
        		) VALUES (?, 0, 1, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, NULL);`,
				[gameId]
			);

			await db.runAsync(
				`INSERT INTO ships (
          game_id, hull, deck, hospital, caboose, cabin, bridge,
          last_action, page, location,
          meat, vegetables, grain, materials, artifacts, coins
        ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);`,
				[gameId]
			);

			Alert.alert('Успіх', 'Гру створено!');
			navigation.goBack();
		} catch (error) {
			console.error('Помилка створення гри:', error);
			Alert.alert('Помилка', 'Не вдалося створити гру');
		}
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
					<Text style={styles.header}>Нова гра</Text>
				</View>
			</View>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.field}>
					<Text style={styles.label}>Назва гри</Text>
					<TextInput
						style={styles.input}
						value={gameName}
						onChangeText={setGameName}
						placeholder="Введіть назву"
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Кількість гравців</Text>
					<View style={styles.radioGroup}>
						{[1, 2, 3, 4].map((num) => (
							<TouchableOpacity
								key={num}
								style={[styles.radioButton, playerCount === num && styles.radioSelected]}
								onPress={() => setPlayerCount(num)}
							>
								<Text style={[styles.radioText, playerCount === num && styles.radioTextSelected]}>
									{num}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{players.map((player, index) => (
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
								const available = isCharacterAvailable(index, char.id);
								const isSelected = player.selectedCharacterIds.includes(char.id);
								return (
									<TouchableOpacity
										key={char.id}
										style={[
											styles.checkboxRow,
											!available && styles.checkboxRowDisabled,
										]}
										onPress={() => available && toggleCharacter(index, char.id)}
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
				))}

				<View style={styles.field}>
					<Text style={styles.label}>Рівень складності</Text>
					<View style={styles.difficultyGroup}>
						<TouchableOpacity
							style={[styles.difficultyButton, difficulty === 'normal' && styles.difficultySelected]}
							onPress={() => setDifficulty('normal')}
						>
							<Text style={[styles.difficultyText, difficulty === 'normal' && styles.difficultyTextSelected]}>
								Звичайний
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.difficultyButton, difficulty === 'hard' && styles.difficultySelected]}
							onPress={() => setDifficulty('hard')}
						>
							<Text style={[styles.difficultyText, difficulty === 'hard' && styles.difficultyTextSelected]}>
								Жорстокий
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				<TouchableOpacity style={styles.createButton} onPress={handleCreateGame}>
					<Text style={styles.createButtonText}>Створити</Text>
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
		borderWidth: 1,
		borderLeftColor: '#f5f0e8',
		borderTopColor: '#f5f0e8',
		borderRightColor: '#f5f0e8',
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
	backButtonText: {
		fontSize: 25,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
		textAlign: 'center',
		textAlignVertical: 'center',
		includeFontPadding: false,
		lineHeight: 50,
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
		gap: 12,
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
	radioSelected: {
		backgroundColor: '#004d57',
	},
	radioText: {
		fontSize: 18,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	radioTextSelected: {
		color: '#fff',
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
	difficultyGroup: {
		flexDirection: 'column',
		gap: 8,
	},
	difficultyButton: {
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: '#004d57',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	difficultySelected: {
		backgroundColor: '#004d57',
	},
	difficultyText: {
		fontSize: 16,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	difficultyTextSelected: {
		color: '#fff',
	},
	createButton: {
		backgroundColor: '#691716',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 20,
	},
	createButtonText: {
		fontSize: 20,
		color: '#fff',
		fontFamily: 'Kyiv-Machine',
		letterSpacing: 1,
	},
});

export default NewGameScreen;