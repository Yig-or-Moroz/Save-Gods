import React, { useState, useEffect } from 'react';

import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	ActivityIndicator,
	LayoutAnimation,
	Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import ShipView from '../components/ShipView';
import CharacterView from '../components/CharacterView';
import PlayerView from '../components/PlayerView';
import EventCardView from '../components/EventCardView';
import TaskView from '../components/TaskView';

import CaptainImage from '../../assets/images/captian-token.webp';

import {
	getLayoutGameScreen,
	type LayoutGameScreenData,
} from '../services/gameService';

// ---------- ТИПИ ----------

type GameData = LayoutGameScreenData['game'];
type Player = LayoutGameScreenData['players'][number];
type ShipData = NonNullable<LayoutGameScreenData['ship']>;
type UnifiedGood = LayoutGameScreenData['allGoods'][number];
type CharacterData = LayoutGameScreenData['characters'][number];
type AbilityCard = LayoutGameScreenData['abilityCards'][number];
type ExperienceCard = LayoutGameScreenData['experienceCards'][number];
type TaskCard = LayoutGameScreenData['taskCards'][number];
type EventCard = LayoutGameScreenData['eventCards'][number];

type Section = {
	id: string;
	title: string;
	type: 'ship' | 'captain' | 'player' | 'events' | 'tasks';
	playerId?: number;
	isCaptain?: boolean;
};

// ---------- ОСНОВНИЙ КОМПОНЕНТ ----------

const LayoutGameScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;

	const [isLoading, setIsLoading] = useState(true);

	const [game, setGame] = useState<GameData | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [ship, setShip] = useState<ShipData | null>(null);
	const [allGoods, setAllGoods] = useState<UnifiedGood[]>([]);
	const [characters, setCharacters] = useState<CharacterData[]>([]);
	const [abilityCards, setAbilityCards] = useState<AbilityCard[]>([]);
	const [experienceCards, setExperienceCards] = useState<ExperienceCard[]>([]);
	const [taskCards, setTaskCards] = useState<TaskCard[]>([]);
	const [eventCards, setEventCards] = useState<EventCard[]>([]);

	const [finalScore, setFinalScore] = useState<number>(0);

	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set()
	);

	// ---------- ЗАВАНТАЖЕННЯ ДАНИХ ----------

	useEffect(() => {
		loadGameData();
	}, [gameId]);

	const loadGameData = async () => {
		try {
			setIsLoading(true);

			const data = await getLayoutGameScreen(gameId);

			setGame(data.game);
			setPlayers(data.players);
			setShip(data.ship);
			setAllGoods(data.allGoods);
			setCharacters(data.characters);
			setAbilityCards(data.abilityCards);
			setExperienceCards(data.experienceCards);
			setTaskCards(data.taskCards);
			setEventCards(data.eventCards);
		} catch (error) {
			console.error('Помилка завантаження даних гри:', error);

			Alert.alert(
				'Помилка',
				error instanceof Error
					? error.message
					: 'Не вдалося завантажити гру'
			);

			navigation.goBack();
		} finally {
			setIsLoading(false);
		}
	};

	// ---------- ФІНАЛЬНИЙ РАХУНОК ----------

	const calculateFinalScore = () => {
		if (!game || !ship) {
			setFinalScore(0);
			return;
		}

		let score = 0;

		// AdventureDeck: за кожну картку - 2 очки
		const adventureCardsCount = allGoods.filter(
			(good) => good.source === 'adventure'
		).length;

		score += adventureCardsCount * 2;

		// AdventureDeck: кожен тотем - ще +2 очки
		const totemCount = allGoods.filter(
			(good) => good.source === 'adventure' && good.isTotem
		).length;

		score += totemCount * 2;

		// TaskDeck: за кожну картку - 1 очко
		score += taskCards.length;

		// Characters: за кожну experience card - 2 очки
		let expCardsCount = 0;

		characters.forEach((character) => {
			if (character.experience_card_id_1) {
				expCardsCount++;
			}

			if (character.experience_card_id_2) {
				expCardsCount++;
			}

			if (character.experience_card_id_3) {
				expCardsCount++;
			}
		});

		score += expCardsCount * 2;

		// Ship: за кожні 2 монети - 1 очко
		score += Math.floor(ship.coins / 2);

		// Ship: за кожен артефакт - 1 очко
		score += ship.artifacts;

		// Win бонуси
		if (game.win === 1) {
			if (game.difficulty_level === 1) {
				// normal
				score += 10;
			} else if (game.difficulty_level === 2) {
				// hard
				score += 25;
			}
		}

		// Штрафи за поразки (normal mode only)
		if (game.difficulty_level === 1) {
			score -= game.number_of_losses * 10;
		}

		setFinalScore(score);
	};

	// Викликаємо перерахунок після зміни необхідних даних
	useEffect(() => {
		calculateFinalScore();
	}, [game, ship, allGoods, characters, taskCards]);

	// ---------- РОЗКРИТТЯ СЕКЦІЙ ----------

	const toggleSection = (sectionId: string) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

		setExpandedSections((prev) => {
			const newSet = new Set(prev);

			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}

			return newSet;
		});
	};

	// ---------- ВІДОБРАЖЕННЯ СЕКЦІЇ ----------

	const renderSection = (section: Section) => {
		const isExpanded = expandedSections.has(section.id);

		let content = null;

		if (section.id === 'ship') {
			content = ship ? (
				<ShipView ship={ship} allGoods={allGoods} />
			) : (
				<View style={styles.sectionContentInner}>
					<Text style={styles.placeholderText}>
						Дані корабля відсутні
					</Text>
				</View>
			);
		} else if (section.id === 'captain') {
			const captainData = characters.find(
				(character) => character.character_name_id === 1
			);

			if (captainData) {
				content = (
					<CharacterView
						character={captainData}
						characterName="Капітан Софі Одеса"
						abilityCards={abilityCards}
						experienceCards={experienceCards}
					/>
				);
			} else {
				content = (
					<View style={styles.sectionContentInner}>
						<Text style={styles.placeholderText}>
							Дані капітана відсутні
						</Text>
					</View>
				);
			}
		} else if (section.type === 'player') {
			const player = players.find(
				(p) => p.id === section.playerId
			);

			if (player) {
				content = (
					<PlayerView
						player={player}
						characters={characters}
						abilityCards={abilityCards}
						experienceCards={experienceCards}
					/>
				);
			} else {
				content = (
					<View style={styles.sectionContentInner}>
						<Text style={styles.placeholderText}>
							Дані гравця відсутні
						</Text>
					</View>
				);
			}
		} else if (section.id === 'events') {
			content = <EventCardView cards={eventCards} />;
		} else if (section.id === 'tasks') {
			content = <TaskView taskCards={taskCards} />;
		} else {
			content = (
				<View style={styles.sectionContentInner}>
					<Text style={styles.placeholderText}>
						Тут буде інформація про {section.title}
					</Text>
				</View>
			);
		}

		const renderSectionTitle = () => {
			if (section.type === 'player' && section.isCaptain) {
				return (
					<View style={styles.sectionTitleContainer}>
						<Text style={styles.sectionTitle}>
							{section.title}
						</Text>

						<Image
							source={CaptainImage}
							style={styles.captainIcon}
						/>
					</View>
				);
			}

			return (
				<Text style={styles.sectionTitle}>
					{section.title}
				</Text>
			);
		};

		return (
			<View
				key={section.id}
				style={styles.sectionContainer}
			>
				<TouchableOpacity
					style={styles.sectionHeader}
					onPress={() => toggleSection(section.id)}
					activeOpacity={0.7}
				>
					{renderSectionTitle()}

					<Ionicons
						name={isExpanded ? 'chevron-up' : 'chevron-down'}
						size={24}
						color="#004d57"
					/>
				</TouchableOpacity>

				{isExpanded && (
					<View style={styles.sectionContent}>
						{content}
					</View>
				)}
			</View>
		);
	};

	// ---------- LOADING ----------

	if (isLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator
					size="large"
					color="#004d57"
				/>

				<Text style={styles.loadingText}>
					Завантаження гри...
				</Text>
			</SafeAreaView>
		);
	}

	if (!game) {
		return null;
	}

	// ---------- СЕКЦІЇ ----------

	const sections: Section[] = [
		{
			id: 'ship',
			title: 'Корабель',
			type: 'ship',
		},

		{
			id: 'captain',
			title: 'Капітан Софі Одеса',
			type: 'captain',
		},

		...players.map((player) => ({
			id: `player-${player.id}`,
			title: player.name,
			type: 'player' as const,
			playerId: player.id,
			isCaptain: player.id === game.current_player_id,
		})),

		{
			id: 'events',
			title: 'Колода подій',
			type: 'events',
		},

		{
			id: 'tasks',
			title: 'Колода завдань',
			type: 'tasks',
		},
	];

	const isNormal = game.difficulty_level === 1;

	// ---------- UI ----------

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerWrapper}>
				<View style={styles.backButtonWrapper}>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={styles.backButton}
					>
						<Ionicons
							name="arrow-back"
							size={22}
							color="#004d57"
						/>
					</TouchableOpacity>
				</View>

				<View style={styles.titleWrapper}>
					<Text style={styles.header}>
						{game.game_name}
					</Text>
				</View>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				{sections.map((section) =>
					renderSection(section)
				)}

				<View style={styles.footerContainer}>
					<View style={styles.footerRow}>
						<Text style={styles.footerLabel}>
							Фінальний рахунок:
						</Text>

						<Text style={styles.footerValue}>
							{finalScore}
						</Text>
					</View>

					<View style={styles.footerRow}>
						<Text style={styles.footerLabel}>
							Очки досвіду:
						</Text>

						<Text style={styles.footerValue}>
							{game.experience}
						</Text>
					</View>

					{isNormal && (
						<View style={styles.footerRow}>
							<Text style={styles.footerLabel}>
								Кількість поразок:
							</Text>

							<Text style={styles.footerValue}>
								{game.number_of_losses}
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

// ---------- СТИЛІ ----------

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

	sectionContainer: {
		backgroundColor: '#f5f0e8',
		overflow: 'hidden',
	},

	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#f5f0e8',
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},

	sectionTitle: {
		fontSize: 22,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},

	sectionTitleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	captainIcon: {
		width: 50,
		height: 25,
		marginLeft: 16,
		resizeMode: 'contain',
	},

	sectionContent: {
		backgroundColor: '#f5f0e8',
	},

	sectionContentInner: {
		padding: 16,
	},

	placeholderText: {
		fontSize: 16,
		color: '#888',
		fontFamily: 'Kyiv-Machine',
		textAlign: 'center',
	},

	footerContainer: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginTop: 8,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},

	footerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 6,
	},

	footerLabel: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},

	footerValue: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},

	winText: {
		color: '#2e7d32',
	},

	loseText: {
		color: '#691716',
	},
});

export default LayoutGameScreen;