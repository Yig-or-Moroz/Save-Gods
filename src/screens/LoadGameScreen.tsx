import React, {
	useState,
	useEffect,
} from 'react';

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

import Ionicons from '@expo/vector-icons/Ionicons';

import {
	getLoadGameScreen,
	type SavedGame,
} from '../services/gameService';

const LoadGameScreen = ({
	navigation,
}: any) => {
	const [games, setGames] = useState<
		SavedGame[]
	>([]);

	const [isLoading, setIsLoading] =
		useState(true);

	useEffect(() => {
		loadGames();
	}, []);

	const loadGames = async () => {
		try {
			const result =
				await getLoadGameScreen();

			setGames(result.games);
		} catch (error) {
			console.error(
				'[LoadGameScreen] LOAD ERROR:',
				error
			);

			Alert.alert(
				'Помилка',
				error instanceof Error
					? error.message
					: 'Не вдалося завантажити список ігор'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (
		dateStr: string
	) => {
		const date = new Date(dateStr);

		return date.toLocaleDateString(
			'uk-UA'
		);
	};

	const renderItem = ({
		item,
	}: {
		item: SavedGame;
	}) => (
		<TouchableOpacity
			style={styles.gameItem}
			onPress={() => {
				navigation.navigate(
					'LayoutGame',
					{
						gameId: item.id,
					}
				);
			}}
			activeOpacity={0.7}
		>
			<View style={styles.gameInfo}>
				<Text style={styles.gameName}>
					{item.game_name}
				</Text>

				<Text style={styles.gameDate}>
					{formatDate(
						item.game_date
					)}
				</Text>

				<Text
					style={styles.gamePlayers}
				>
					Гравці:{'\n'}

					{item.playersNames.length > 0
						? item.playersNames.join(', ')
						: 'Немає гравців'}
				</Text>
			</View>
		</TouchableOpacity>
	);

	if (isLoading) {
		return (
			<SafeAreaView
				style={
					styles.loadingContainer
				}
			>
				<ActivityIndicator
					size="large"
					color="#004d57"
				/>

				<Text
					style={
						styles.loadingText
					}
				>
					Завантаження ігор...
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={styles.container}
		>
			<View
				style={styles.headerWrapper}
			>
				<View
					style={
						styles.backButtonWrapper
					}
				>
					<TouchableOpacity
						onPress={() =>
							navigation.goBack()
						}
						style={styles.backButton}
					>
						<Ionicons
							name="arrow-back"
							size={22}
							color="#004d57"
						/>
					</TouchableOpacity>
				</View>

				<View
					style={styles.titleWrapper}
				>
					<Text
						style={styles.header}
					>
						Розкласти гру
					</Text>
				</View>
			</View>

			{games.length === 0 ? (
				<View
					style={
						styles.emptyContainer
					}
				>
					<Text
						style={styles.emptyText}
					>
						Немає збережених ігор
					</Text>
				</View>
			) : (
				<FlatList
					data={games}
					keyExtractor={(item) =>
						item.id.toString()
					}
					renderItem={renderItem}
					contentContainerStyle={
						styles.listContent
					}
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

export default LoadGameScreen;