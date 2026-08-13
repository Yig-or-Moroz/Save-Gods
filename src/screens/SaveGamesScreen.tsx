import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';

type Game = {
	id: number;
	game_name: string;
	game_date: string;
	playersNames: string[]; // додаємо масив імен гравців
};

const SaveGamesScreen = ({ navigation }: any) => {
	const [games, setGames] = useState<Game[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadGames();
	}, []);

	const loadGames = async () => {
		try {
			// 1. Завантажуємо всі ігри
			const gamesResult = await db.getAllAsync<{
				id: number;
				game_name: string;
				game_date: string;
			}>(
				'SELECT id, game_name, game_date FROM games ORDER BY game_date DESC;'
			);

			// 2. Завантажуємо всіх гравців для цих ігор
			const playersResult = await db.getAllAsync<{
				game_id: number;
				name: string;
			}>('SELECT game_id, name FROM players ORDER BY game_id;');

			// 3. Групуємо гравців за game_id
			const playersByGame: { [key: number]: string[] } = {};
			for (const p of playersResult) {
				if (!playersByGame[p.game_id]) {
					playersByGame[p.game_id] = [];
				}
				if (p.name && p.name.trim() !== '') {
					playersByGame[p.game_id].push(p.name);
				}
			}

			// 4. Формуємо масив ігор з іменами гравців
			const gamesWithPlayers: Game[] = gamesResult.map((g) => ({
				id: g.id,
				game_name: g.game_name,
				game_date: g.game_date,
				playersNames: playersByGame[g.id] || [],
			}));

			setGames(gamesWithPlayers);
		} catch (error) {
			console.error('Помилка завантаження ігор:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити список ігор');
		} finally {
			setIsLoading(false);
		}
	};

	const deleteGame = (gameId: number) => {
		Alert.alert(
			'Видалити гру',
			'Ви впевнені, що хочете видалити цю гру? Всі дані будуть втрачені.',
			[
				{ text: 'Скасувати', style: 'cancel' },
				{
					text: 'Видалити',
					style: 'destructive',
					onPress: async () => {
						try {
							await db.runAsync('DELETE FROM games WHERE id = ?;', [gameId]);
							await loadGames();
						} catch (error) {
							console.error('Помилка видалення гри:', error);
							Alert.alert('Помилка', 'Не вдалося видалити гру');
						}
					},
				},
			]
		);
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('uk-UA');
	};

	const renderItem = ({ item }: { item: Game }) => (
		<TouchableOpacity
			style={styles.gameItem}
			onPress={() => navigation.navigate('Game', { gameId: item.id })}
			activeOpacity={0.7}
		>
			<View style={styles.gameInfo}>
				<Text style={styles.gameName}>{item.game_name}</Text>
				<Text style={styles.gameDate}>{formatDate(item.game_date)}</Text>
				<Text style={styles.gamePlayers}>
					Гравці: {"\n"}{item.playersNames.length > 0 ? item.playersNames.join(', ') : 'Немає гравців'}
				</Text>
			</View>
			<TouchableOpacity style={styles.deleteButton} onPress={() => deleteGame(item.id)}>
				<Ionicons name="trash-outline" size={24} color="#691716" />
			</TouchableOpacity>
		</TouchableOpacity>
	);

	if (isLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#004d57" />
				<Text style={styles.loadingText}>Завантаження ігор...</Text>
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
					<Text style={styles.header}>Оберіть гру</Text>
				</View>
			</View>

			{games.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>Немає збережених ігор</Text>
				</View>
			) : (
				<FlatList
					data={games}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent}
				/>
			)}
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
	listContent: {
		padding: 20,
	},
	gameItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	gameInfo: {
		flex: 1,
	},
	gameName: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 4,
	},
	gameDate: {
		fontSize: 14,
		color: '#666',
		marginBottom: 8,
	},
	gamePlayers: {
		fontSize: 14,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
	},
	deleteButton: {
		padding: 8,
		marginLeft: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#999',
	},
});

export default SaveGamesScreen;