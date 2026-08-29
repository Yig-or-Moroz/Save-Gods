import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	Image,
} from 'react-native';
import { db } from '../database';

import EventMildImage from '../../assets/images/event-mild.webp';
import EventPerilousImage from '../../assets/images/event-perilous.webp';
import EventDeadlyImage from '../../assets/images/event-deadly.webp';

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
			Alert.alert('Помилка', 'Не вдалося завантажити колоду подій');
		} finally {
			setIsLoading(false);
		}
	};

	const getDeckCards = (deckIndex: number) => {
		const typeOrder = ['помірні', 'небезпечні', 'смертоносні'];
		const deckCards: EventCardWithOrder[] = [];
		for (const type of typeOrder) {
			const typeCards = cards
				.filter((c) => c.type.toLowerCase() === type.toLowerCase())
				.sort((a, b) => a.order_number - b.order_number);
			const start = deckIndex * 6;
			const end = start + 6;
			const slice = typeCards.slice(start, end);
			deckCards.push(...slice);
		}
		return deckCards;
	};

	const toggleDeck = (deckNumber: number) => {
		setExpandedDecks((prev) => ({
			...prev,
			[deckNumber]: !prev[deckNumber],
		}));
	};

	const getTypeImage = (type: string) => {
		const lowerType = type.toLowerCase();
		if (lowerType === 'помірні') return EventMildImage;
		if (lowerType === 'небезпечні') return EventPerilousImage;
		if (lowerType === 'смертоносні') return EventDeadlyImage;
		return null;
	};

	const renderDeck = (deckNumber: number) => {
		const deckIndex = deckNumber - 1;
		const deckCards = getDeckCards(deckIndex);
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
								console.log(card.remains_in_game);
								const isConstant = card.remains_in_game === 1;
								const typeImage = getTypeImage(card.type);
								return (
									<View key={card.id} style={[styles.cardItem, isConstant && styles.cardItemConstant]}>
										<Text style={[styles.cardName, isConstant && styles.cardNameConstant]}>
											{card.name}
										</Text>
										{typeImage && (
											<Image source={typeImage} style={styles.typeImage} />
										)}
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
		paddingVertical: 16,
		paddingHorizontal: 4,
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
		backgroundColor: '#f5f0e8',
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
		padding: 16,
		backgroundColor: '#f5f0e8',
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	deckTitle: {
		fontSize: 24,
		fontFamily: 'Kyiv-Machine',
		color: '#691716',
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
		paddingVertical: 8,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	cardItemConstant: {
		backgroundColor: '#691716',
		borderStyle: 'dashed',
		borderBottomWidth: 2,
		borderTopWidth: 2,
		borderBottomColor: "#c84137",
		borderTopColor: "#c84137",
	},
	cardName: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		flex: 1,
	},
	cardNameConstant: {
		color: '#fff',
	},
	typeImage: {
		width: 30,
		height: 30,
		marginLeft: 8,
		borderRadius: 7,
		borderWidth: 1,
		borderColor: '#39090b',
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