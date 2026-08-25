import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';

type EventCard = {
	id: number;
	name: string;
	type: string;
	property_constantly: string | number | boolean; // може бути різних типів
};

type EventDeck = {
	id: number;
	game_id: number;
	event_card_id: number;
	remains_in_game: number;
	order_number: number;
};

type GroupState = {
	[type: string]: boolean;
};

const EventDeckScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [eventCards, setEventCards] = useState<EventCard[]>([]);
	const [eventDeck, setEventDeck] = useState<Map<number, EventDeck>>(new Map());
	const [groups, setGroups] = useState<GroupState>({
		'Помірні': false,
		'Небезпечні': false,
		'Смертоносні': false,
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const cardsResult = await db.getAllAsync<EventCard>(
				'SELECT * FROM event_cards ORDER BY name;'
			);
			setEventCards(cardsResult);

			const deckResult = await db.getAllAsync<EventDeck>(
				'SELECT * FROM event_decks WHERE game_id = ? ORDER BY order_number;',
				[gameId]
			);
			const deckMap = new Map<number, EventDeck>();
			deckResult.forEach((item) => {
				deckMap.set(item.event_card_id, item);
			});
			setEventDeck(deckMap);
		} catch (error) {
			console.error('Помилка завантаження колоди подій:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити колоду подій');
		} finally {
			setIsLoading(false);
		}
	};

	const addEventCard = async (card: EventCard) => {
		if (eventDeck.has(card.id)) {
			await removeEventCard(card.id);
			return;
		}

		try {
			const maxOrder = Math.max(
				0,
				...Array.from(eventDeck.values()).map((item) => item.order_number)
			);
			const newOrder = maxOrder + 1;

			const result = await db.runAsync(
				`INSERT INTO event_decks (game_id, event_card_id, remains_in_game, order_number)
         VALUES (?, ?, ?, ?);`,
				[gameId, card.id, 0, newOrder]
			);

			const newDeckItem: EventDeck = {
				id: result.lastInsertRowId,
				game_id: gameId,
				event_card_id: card.id,
				remains_in_game: 0,
				order_number: newOrder,
			};

			setEventDeck((prev) => new Map(prev).set(card.id, newDeckItem));
		} catch (error) {
			console.error('Помилка додавання картки події:', error);
			Alert.alert('Помилка', 'Не вдалося додати картку події');
		}
	};

	const removeEventCard = async (eventCardId: number) => {
		const deckItem = eventDeck.get(eventCardId);
		if (!deckItem) return;

		try {
			await db.runAsync('DELETE FROM event_decks WHERE id = ?;', [deckItem.id]);
			setEventDeck((prev) => {
				const newMap = new Map(prev);
				newMap.delete(eventCardId);
				return newMap;
			});
		} catch (error) {
			console.error('Помилка видалення картки події:', error);
			Alert.alert('Помилка', 'Не вдалося видалити картку події');
		}
	};

	const toggleRemainsInGame = async (eventCardId: number) => {
		const deckItem = eventDeck.get(eventCardId);
		if (!deckItem) return;

		const newValue = deckItem.remains_in_game === 1 ? 0 : 1;
		try {
			await db.runAsync(
				'UPDATE event_decks SET remains_in_game = ? WHERE id = ?;',
				[newValue, deckItem.id]
			);
			setEventDeck((prev) => {
				const newMap = new Map(prev);
				newMap.set(eventCardId, { ...deckItem, remains_in_game: newValue });
				return newMap;
			});
		} catch (error) {
			console.error('Помилка оновлення remains_in_game:', error);
			Alert.alert('Помилка', 'Не вдалося оновити стан картки');
		}
	};

	const toggleGroup = (type: string) => {
		setGroups((prev) => ({ ...prev, [type]: !prev[type] }));
	};

	// Перевірка, чи є у картки властивість "постійна"
	const hasPropertyConstantly = (card: EventCard): boolean => {
		const raw = card.property_constantly;
		if (typeof raw === 'boolean') return raw;
		if (typeof raw === 'number') return raw === 1;
		if (typeof raw === 'string') {
			const lower = raw.toLowerCase();
			return lower === 'true' || lower === '1';
		}
		return false;
	};

	const renderEventCard = (card: EventCard) => {
		const isAdded = eventDeck.has(card.id);
		const deckItem = isAdded ? eventDeck.get(card.id) : null;

		const containerStyle = [
			styles.cardContainer,
			isAdded && styles.cardContainerActive,
		];
		const nameStyle = [
			styles.cardName,
			isAdded && styles.cardNameActive,
		];
		const hasProperty = hasPropertyConstantly(card);

		return (
			<TouchableOpacity
				key={card.id}
				style={containerStyle}
				onPress={() => addEventCard(card)}
				activeOpacity={0.7}
			>
				<View style={styles.cardRow}>
					{isAdded && (
						<Text style={[styles.cardNumber, styles.cardNumberActive]}>
							{deckItem?.order_number}.
						</Text>
					)}
					<Text style={nameStyle}>{card.name}</Text>
					{isAdded && hasProperty && (
						<TouchableOpacity
							style={styles.checkboxButton}
							onPress={(e) => {
								e.stopPropagation();
								toggleRemainsInGame(card.id);
							}}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<View
								style={[
									styles.checkbox,
									deckItem?.remains_in_game === 1 && styles.checkboxChecked,
								]}
							>
								<Text style={[
									styles.checkboxLabel,
									deckItem?.remains_in_game === 1 && styles.checkboxLabelChecked,
								]}>П</Text>
							</View>
						</TouchableOpacity>
					)}
				</View>
			</TouchableOpacity>
		);
	};

	const renderGroup = (type: string) => {
		const cards = eventCards.filter((c) => c.type === type);
		const isOpen = groups[type] || false;

		return (
			<View key={type} style={styles.groupContainer}>
				<TouchableOpacity
					style={styles.groupHeader}
					onPress={() => toggleGroup(type)}
					activeOpacity={0.7}
				>
					<Text style={styles.groupTitle}>{type[0].toUpperCase() + type.slice(1)}</Text>
					<Ionicons
						name={isOpen ? 'chevron-up' : 'chevron-down'}
						size={24}
						color="#004d57"
					/>
				</TouchableOpacity>
				{isOpen && (
					<View style={styles.cardList}>
						{cards.length === 0 ? (
							<Text style={styles.emptyText}>Немає карток цього типу</Text>
						) : (
							cards.map((card) => renderEventCard(card))
						)}
					</View>
				)}
			</View>
		);
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
					<Text style={styles.header}>Колода подій</Text>
				</View>
			</View>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				{renderGroup('помірні')}
				{renderGroup('небезпечні')}
				{renderGroup('смертоносні')}
			</ScrollView>
			<View style={styles.footer}>
				<Text style={styles.subHeaderTextA}>П</Text>
				<Text style={styles.subHeaderText}>- картка залишається у грі</Text>
			</View>
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
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 40,
	},
	groupContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		marginBottom: 12,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	groupHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#f9f6f0',
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	groupTitle: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	cardList: {
		//		paddingHorizontal: 16,
		//		paddingBottom: 8,
	},
	cardContainer: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		backgroundColor: '#f9f6f0',
	},
	cardContainerActive: {
		backgroundColor: '#004d57',
		borderColor: '#004d57',
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	cardName: {
		flex: 1,
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	cardNameActive: {
		color: '#fff',
	},
	cardNumber: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
		marginRight: 8,
	},
	cardNumberActive: {
		color: '#fff',
	},
	checkboxButton: {
		marginLeft: 8,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#fff',
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkboxChecked: {
		borderColor: 'transparent',
		backgroundColor: 'transparent',
	},
	checkboxLabel: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#ccc',
	},
	checkboxLabelChecked: {
		color: '#fff',
	},
	emptyText: {
		fontSize: 14,
		color: '#999',
		fontFamily: 'Kyiv-Machine',
		textAlign: 'center',
		paddingVertical: 8,
	},
	footer: {
		height: 60,
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		gap: 4,
		borderTopWidth: 1,
		borderTopColor: '#004d57',
	},
	subHeaderText: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	subHeaderTextA: {
		width: 26,
		height: 26,
		textAlign: 'center',
		borderRadius: 4,
		backgroundColor: '#004d57',
		fontSize: 22,
		fontFamily: 'Kyiv-Machine',
		color: '#fff',
	},
});

export default EventDeckScreen;