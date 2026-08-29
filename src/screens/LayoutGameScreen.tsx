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
	UIManager,
	Platform,
	Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';
import ShipView from '../components/ShipView';
import CharacterView from '../components/CharacterView';
import PlayerView from '../components/PlayerView';
import EventCardView from '../components/EventCardView';

import CaptainImage from '../../assets/images/captian-token.webp';

// ---------- ТИПИ ----------
type GameData = {
	id: number;
	game_name: string;
	number_of_players: number;
	difficulty_level: number;
	experience: number;
	number_of_losses: number;
	win: number;
};

type Player = {
	id: number;
	name: string;
	captain: number;
};

type ShipData = {
	id: number;
	game_id: number;
	hull: number;
	deck: number;
	hospital: number;
	caboose: number;
	cabin: number;
	bridge: number;
	last_action: number;
	page: number;
	location: string;
	meat: number;
	vegetables: number;
	grain: number;
	materials: number;
	artifacts: number;
	coins: number;
};

type Good = {
	id: number;
	name: string;
	type: string;
};

type ChestGood = {
	id: number;
	game_id: number;
	goods_id: number;
	activated: number;
};

type AdventureDeckItem = {
	id: number;
	game_id: number;
	card_number: number;
	name: string;
	type: string;
	totem: number;
	activated: number;
};

type UnifiedGood = {
	id: number;
	name: string;
	type: string;
	activated: boolean;
	isTotem: boolean;
	source: 'chest' | 'adventure';
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
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

	useEffect(() => {
		loadGameData();
	}, []);

	const loadGameData = async () => {
		try {
			const gameResult = await db.getAllAsync<GameData>(
				'SELECT id, game_name, number_of_players, difficulty_level, experience, number_of_losses, win FROM games WHERE id = ?;',
				[gameId]
			);
			if (gameResult.length === 0) {
				Alert.alert('Помилка', 'Гру не знайдено');
				navigation.goBack();
				return;
			}
			setGame(gameResult[0]);

			const playersResult = await db.getAllAsync<Player>(
				'SELECT id, name, captain FROM players WHERE game_id = ? ORDER BY id;',
				[gameId]
			);
			setPlayers(playersResult);

			const shipResult = await db.getAllAsync<ShipData>(
				'SELECT * FROM ships WHERE game_id = ?;',
				[gameId]
			);
			if (shipResult.length > 0) {
				setShip(shipResult[0]);
			}

			const chestResult = await db.getAllAsync<ChestGood>(
				'SELECT goods_id, activated FROM chest_goods WHERE game_id = ?;',
				[gameId]
			);
			let combinedGoods: UnifiedGood[] = [];
			if (chestResult.length > 0) {
				const goodsIds = chestResult.map((item) => item.goods_id);
				const goodsResult = await db.getAllAsync<Good>(
					`SELECT * FROM goods WHERE id IN (${goodsIds.join(',')});`
				);
				combinedGoods = goodsResult.map((good) => {
					const chest = chestResult.find((c) => c.goods_id === good.id);
					return {
						id: good.id,
						name: good.name,
						type: good.type,
						activated: chest?.activated === 1,
						isTotem: good.type.toLowerCase().includes('тотем'),
						source: 'chest' as const,
					};
				});
			}

			const adventureResult = await db.getAllAsync<AdventureDeckItem>(
				'SELECT id, card_number, name, type, totem, activated FROM adventure_decks WHERE game_id = ?;',
				[gameId]
			);
			const adventureGoods: UnifiedGood[] = adventureResult.map((item) => ({
				id: item.id,
				name: item.name,
				type: item.type,
				activated: item.activated === 1,
				isTotem: item.totem === 1,
				source: 'adventure' as const,
			}));

			setAllGoods([...combinedGoods, ...adventureGoods]);

			const abilityResult = await db.getAllAsync<AbilityCard>(
				'SELECT * FROM ability_cards ORDER BY name;'
			);
			setAbilityCards(abilityResult);

			const experienceResult = await db.getAllAsync<ExperienceCard>(
				'SELECT * FROM experience_cards ORDER BY name;'
			);
			setExperienceCards(experienceResult);

			const charactersResult = await db.getAllAsync<CharacterData>(
				'SELECT * FROM characters WHERE game_id = ?;',
				[gameId]
			);
			setCharacters(charactersResult);
		} catch (error) {
			console.error('Помилка завантаження даних гри:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити гру');
		} finally {
			setIsLoading(false);
		}
	};

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

	const renderSection = (section: Section) => {
		const isExpanded = expandedSections.has(section.id);

		let content = null;

		if (section.id === 'ship') {
			content = ship ? (
				<ShipView ship={ship} allGoods={allGoods} />
			) : (
				<View style={styles.sectionContentInner}>
					<Text style={styles.placeholderText}>Дані корабля відсутні</Text>
				</View>
			);
		} else if (section.id === 'captain') {
			const captainData = characters.find((c) => c.character_name_id === 1);
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
						<Text style={styles.placeholderText}>Дані капітана відсутні</Text>
					</View>
				);
			}
		} else if (section.type === 'player') {
			const player = players.find((p) => p.id === section.playerId);
			if (player) {
				content = (
					<PlayerView
						playerId={player.id}
						gameId={game?.id || 0}
						abilityCards={abilityCards}
						experienceCards={experienceCards}
					/>
				);
			} else {
				content = (
					<View style={styles.sectionContentInner}>
						<Text style={styles.placeholderText}>Дані гравця відсутні</Text>
					</View>
				);
			}
		} else if (section.id === 'events') {
			content = <EventCardView gameId={game?.id || 0} />;
		} else {
			content = (
				<View style={styles.sectionContentInner}>
					<Text style={styles.placeholderText}>Тут буде інформація про {section.title}</Text>
				</View>
			);
		}

		const renderSectionTitle = () => {
			if (section.type === 'player' && section.isCaptain) {
				return (
					<View style={styles.sectionTitleContainer}>
						<Text style={styles.sectionTitle}>{section.title}</Text>
						<Image source={CaptainImage} style={styles.captainIcon} />
					</View>
				);
			}
			return <Text style={styles.sectionTitle}>{section.title}</Text>;
		};

		return (
			<View key={section.id} style={styles.sectionContainer}>
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
				{isExpanded && <View style={styles.sectionContent}>{content}</View>}
			</View>
		);
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

	const sections: Section[] = [
		{ id: 'ship', title: 'Корабель', type: 'ship' },
		{ id: 'captain', title: 'Капітан Софі Одеса', type: 'captain' },
		...players.map((p) => ({
			id: `player-${p.id}`,
			title: p.name,
			type: 'player' as const,
			playerId: p.id,
			isCaptain: p.captain === 1,
		})),
		{ id: 'events', title: 'Колода подій', type: 'events' },
		{ id: 'tasks', title: 'Колода завдань', type: 'tasks' },
	];

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

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				{sections.map((section) => renderSection(section))}

				<View style={styles.footerContainer}>
					<View style={styles.footerRow}>
						<Text style={styles.footerLabel}>Фінальний рахунок:</Text>
						<Text style={[styles.footerValue, game.win === 1 ? styles.winText : styles.loseText]}>
							{game.win === 1 ? 'Перемога!' : 'Поразка'}
						</Text>
					</View>
					<View style={styles.footerRow}>
						<Text style={styles.footerLabel}>Очки досвіду:</Text>
						<Text style={styles.footerValue}>{game.experience}</Text>
					</View>
					{isNormal && (
						<View style={styles.footerRow}>
							<Text style={styles.footerLabel}>Кількість поразок:</Text>
							<Text style={styles.footerValue}>{game.number_of_losses}</Text>
						</View>
					)}
				</View>
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
		resizeMode: "contain",
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