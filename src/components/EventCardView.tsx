import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { db } from '../database';

type EventDeckItem = {
	id: number;
	game_id: number;
	event_card_id: number;
	order_number: number;
	remains_in_game: number;
};

type EventCard = {
	id: number;
	name: string;
	type: string;
	property_constantly: number | boolean;
};

type EventCardWithOrder = EventCard & {
	order_number: number;
	remains_in_game: number;
};

type Props = {
	gameId: number;
};

const EventCardView = ({ gameId }: Props) => {
	const [isLoading, setIsLoading] = useState(true);
	const [cards, setCards] = useState<EventCardWithOrder[]>([]);
	const [expandedDecks, setExpandedDecks] = useState<{ [key: number]: boolean }>({
		1: false,
		2: false,
		3: false,
	});

	useEffect(() => {
		loadEventCards();
	}, []);

	const loadEventCards = async () => {
		try {
			const result = await db.getAllAsync<EventCardWithOrder>(
				`SELECT ed.*, ec.name, ec.type, ec.property_constantly 
         FROM event_decks ed
         JOIN event_cards ec ON ed.event_card_id = ec.id
         WHERE ed.game_id = ?
         ORDER BY ed.order_number;`,
				[gameId]
			);
			setCards(result);
		} catch (error) {
			console.error('Помилка завантаження колоди подій:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити колоду подій');
		} finally {
			setIsLoading(false);
		}
	};

	const getDeckCards = (deckNumber: number) => {
		const start = (deckNumber - 1) * 18;
		const end = deckNumber * 18;
		let deckCards = cards.filter((c) => c.order_number > start && c.order_number <= end);
		// Групуємо за типом: Помірні, Небезпечні, Смертоносні
		const typeOrder = ['Помірні', 'Небезпечні', 'Смертоносні'];
		const sorted = [...deckCards].sort((a, b) => {
			const indexA = typeOrder.indexOf(a.type);
			const indexB = typeOrder.indexOf(b.type);
			if (indexA !== indexB) return indexA - indexB;
			return a.order_number - b.order_number;
		});
		return sorted;
	};

	const toggleDeck = (deckNumber: number) => {
		setExpandedDecks((prev) => ({
			...prev,
			[deckNumber]: !prev[deckNumber],
		}));
	};

	const renderDeck = (deckNumber: number) => {
		const deckCards = getDeckCards(deckNumber);
		const isExpanded = expandedDecks[deckNumber] || false;
		const hasCards = deckCards.length > 0;

		return (
			<View key={deckNumber} style={styles.deckContainer}>
				<TouchableOpacity style={styles.deckHeader} onPress={() => toggleDeck(deckNumber)}>
					<Text style={styles.deckTitle}>Колода {deckNumber}</Text>
					<Text style={styles.cardCount}>{deckCards.length} карт</Text>
				</TouchableOpacity>
				{isExpanded && (
					<View style={styles.deckContent}>
						{hasCards ? (
							deckCards.map((card) => {
								const isConstant = card.property_constantly === true || card.property_constantly === 1;
								return (
									<View key={card.id} style={[styles.cardItem, isConstant && styles.cardItemConstant]}>
										<Text style={[styles.cardName, isConstant && styles.cardNameConstant]}>
											{card.name}
										</Text>
										<Text style={styles.cardType}>{card.type}</Text>
									</View>
								);
							})
						) : (
							<Text style={styles.emptyText}>Колода порожня</Text>
						)}
					</View>
				)}
			</View>
		);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#004d57" />
				<Text style={styles.loadingText}>Завантаження колоди подій...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{cards.length === 0 ? (
				<Text style={styles.emptyDeckText}>Немає карток у колоді подій</Text>
			) : (
				<>
					{renderDeck(1)}
					{renderDeck(2)}
					{renderDeck(3)}
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f5f0e8',
		padding: 16,
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
	deckContainer: {
		marginBottom: 12,
		backgroundColor: '#fff',
		borderRadius: 8,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	deckHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		backgroundColor: '#f9f6f0',
		borderBottomWidth: 1,
		borderBottomColor: '#e0d5c4',
	},
	deckTitle: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	cardCount: {
		fontSize: 14,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
	},
	deckContent: {
		padding: 8,
	},
	cardItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	cardItemConstant: {
		backgroundColor: '#fff0f0',
	},
	cardName: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#333',
	},
	cardNameConstant: {
		color: '#691716',
		fontWeight: 'bold',
	},
	cardType: {
		fontSize: 14,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
	},
	emptyText: {
		fontSize: 14,
		color: '#999',
		fontFamily: 'Kyiv-Machine',
		textAlign: 'center',
		padding: 8,
	},
	emptyDeckText: {
		fontSize: 16,
		color: '#999',
		fontFamily: 'Kyiv-Machine',
		textAlign: 'center',
	},
});

export default EventCardView;