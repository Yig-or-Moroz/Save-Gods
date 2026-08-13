import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	ActivityIndicator,
	TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';

type GameData = {
	id: number;
	game_name: string;
	game_date: string;
	number_of_players: number;
	difficulty_level: number;
	number_of_losses: number;
	experience: number;
	win: number;
};

type Player = {
	id: number;
	name: string;
};

const GameScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [game, setGame] = useState<GameData | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [experience, setExperience] = useState('');
	const [lossesCount, setLossesCount] = useState(0);
	const [win, setWin] = useState(false);

	useEffect(() => {
		loadGameData();
	}, []);

	const loadGameData = async () => {
		try {
			const gameResult = await db.getAllAsync<GameData>(
				'SELECT * FROM games WHERE id = ?;',
				[gameId]
			);
			if (gameResult.length === 0) {
				Alert.alert('Помилка', 'Гру не знайдено');
				navigation.goBack();
				return;
			}
			const gameData = gameResult[0];
			setGame(gameData);
			setExperience(gameData.experience.toString());
			setLossesCount(gameData.number_of_losses);
			setWin(gameData.win === 1);

			const playersResult = await db.getAllAsync<Player>(
				'SELECT id, name FROM players WHERE game_id = ? ORDER BY id;',
				[gameId]
			);
			setPlayers(playersResult);
		} catch (error) {
			console.error('Помилка завантаження даних гри:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити гру');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			const expValue = parseInt(experience) || 0;
			await db.runAsync(
				'UPDATE games SET experience = ?, number_of_losses = ?, win = ? WHERE id = ?;',
				[expValue, lossesCount, win ? 1 : 0, gameId]
			);
			Alert.alert('Успіх', 'Дані збережено!', [
				{ text: 'ОК', onPress: () => navigation.navigate('Home') }
			]);
		} catch (error) {
			console.error('Помилка збереження:', error);
			Alert.alert('Помилка', 'Не вдалося зберегти дані');
		}
	};

	const toggleLoss = (index: number) => {
		if (lossesCount === index) {
			setLossesCount(0);
		} else {
			setLossesCount(index);
		}
	};

	const toggleWin = () => {
		setWin(!win);
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#004d57" />
				<Text style={styles.loadingText}>Завантаження гри...</Text>
			</SafeAreaView>
		);
	}

	if (!game) {
		return null;
	}

	const isNormal = game.difficulty_level === 1;

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerWrapper}>
				<View style={styles.backButtonWrapper}>
					<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
						<Ionicons name="arrow-back" size={22} color="#004d57" />
					</TouchableOpacity>
				</View>
				<View style={styles.titleWrapper}>
					<Text style={styles.header}>{game.game_name}</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.navButtons}>
					<TouchableOpacity
						style={styles.navButton}
						onPress={() => Alert.alert('Корабель', 'Тут буде екран корабля')}
					>
						<Text style={styles.navButtonText}>Корабель</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.navButton}
						onPress={() => Alert.alert('Капітан Софі Одеса', 'Тут буде екран капітана')}
					>
						<Text style={styles.navButtonText}>Капітан Софі Одеса</Text>
					</TouchableOpacity>

					{players.map((player) => (
						<TouchableOpacity
							key={player.id}
							style={styles.navButton}
							onPress={() => Alert.alert(`Гравець ${player.name}`, 'Тут буде екран гравця')}
						>
							<Text style={styles.navButtonText}>{player.name}</Text>
						</TouchableOpacity>
					))}

					<TouchableOpacity
						style={styles.navButton}
						onPress={() => Alert.alert('Колода подій', 'Тут буде екран колоди подій')}
					>
						<Text style={styles.navButtonText}>Колода подій</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.navButton}
						onPress={() => Alert.alert('Колода завдань', 'Тут буде екран колоди завдань')}
					>
						<Text style={styles.navButtonText}>Колода завдань</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Досвід</Text>
					<TextInput
						style={styles.input}
						value={experience}
						onChangeText={setExperience}
						keyboardType="numeric"
						maxLength={6}
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Поразки</Text>
					{isNormal ? (
						<View style={styles.lossesRow}>
							{[1, 2, 3, 4, 5, 6].map((num) => (
								<TouchableOpacity
									key={num}
									style={[
										styles.lossButton,
										lossesCount === num && styles.lossButtonActive,
									]}
									onPress={() => toggleLoss(num)}
								>
									<Text
										style={[
											styles.lossButtonText,
											lossesCount === num && styles.lossButtonTextActive,
										]}
									>
										{num}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					) : (
						<TouchableOpacity
							style={[styles.lossButton, lossesCount === 1 && styles.lossButtonActive]}
							onPress={() => setLossesCount(lossesCount === 1 ? 0 : 1)}
						>
							<Text
								style={[
									styles.lossButtonText,
									lossesCount === 1 && styles.lossButtonTextActive,
								]}
							>
								{lossesCount === 1 ? '✓' : ' '}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				<View style={styles.field}>
					<TouchableOpacity style={styles.winRow} onPress={toggleWin}>
						<View style={[styles.checkbox, win && styles.checkboxChecked]} />
						<Text style={styles.winText}>Win!</Text>
					</TouchableOpacity>
				</View>

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
	navButtons: {
		marginBottom: 20,
	},
	navButton: {
		backgroundColor: '#fff',
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 10,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#004d57',
	},
	navButtonText: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		textAlign: 'center',
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
	lossesRow: {
		flexDirection: 'row',
		gap: 12,
	},
	lossButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		borderColor: '#004d57',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
	},
	lossButtonActive: {
		backgroundColor: '#004d57',
	},
	lossButtonText: {
		fontSize: 18,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	lossButtonTextActive: {
		color: '#fff',
	},
	winRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	checkbox: {
		width: 28,
		height: 28,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: '#004d57',
		marginRight: 12,
		backgroundColor: '#fff',
	},
	checkboxChecked: {
		backgroundColor: '#004d57',
	},
	winText: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
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

export default GameScreen;