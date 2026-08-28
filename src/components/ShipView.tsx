import React from 'react';
import {
	View,
	Text,
	ImageBackground,
	Image,
	StyleSheet,
} from 'react-native';
import FateBackgroundImage from '../../assets/images/fate.webp';
import MeatBackgroundImage from '../../assets/images/resource-token-meat.webp';
import GrainBackgroundImage from '../../assets/images/resource-token-grain.webp';
import VegetablesBackgroundImage from '../../assets/images/resource-token-vegetables.webp';
import MaterialsBackgroundImage from '../../assets/images/resource-token-materials.webp';
import ArtifactBackgroundImage from '../../assets/images/resource-token-artifact.webp';
import CoinBackgroundImage from '../../assets/images/resource-token-coin.webp';
import TotemBackgroundImage from '../../assets/images/totem.webp';
import CommandCostBackgroundImage from '../../assets/images/command-cost.webp';

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

type UnifiedGood = {
	id: number;
	name: string;
	type: string;
	activated: boolean;
	isTotem: boolean;
	source: 'chest' | 'adventure';
};

type Props = {
	ship: ShipData;
	allGoods: UnifiedGood[];
};

// Бажаний порядок типів майна
const typeOrder = ['Стартова', 'Зброя', 'Спорядження', 'Рецепт', 'Пасажир', 'Тварина'];

const ShipView = ({ ship, allGoods }: Props) => {
	const damageParts = [
		{ label: 'Корпус', value: ship.hull, key: 'hull' },
		{ label: 'Палуба', value: ship.deck, key: 'deck' },
		{ label: 'Шпиталь', value: ship.hospital, key: 'hospital' },
		{ label: 'Камбуз', value: ship.caboose, key: 'caboose' },
		{ label: 'Каюта', value: ship.cabin, key: 'cabin' },
		{ label: 'Місток', value: ship.bridge, key: 'bridge' },
	];

	const activeDamages = damageParts.filter((part) => part.value > 0);

	const resources = [
		{ value: ship.meat, key: MeatBackgroundImage },
		{ value: ship.vegetables, key: VegetablesBackgroundImage },
		{ value: ship.grain, key: GrainBackgroundImage },
		{ value: ship.materials, key: MaterialsBackgroundImage },
		{ value: ship.artifacts, key: ArtifactBackgroundImage },
		{ value: ship.coins, key: CoinBackgroundImage },
	];
	const activeResources = resources.filter((r) => r.value > 0);

	// Групуємо майно за типом
	const goodsByType: { [type: string]: UnifiedGood[] } = {};
	allGoods.forEach((good) => {
		if (!goodsByType[good.type]) {
			goodsByType[good.type] = [];
		}
		goodsByType[good.type].push(good);
	});

	// Сортуємо типи за бажаним порядком
	const sortedTypes = Object.keys(goodsByType).sort((a, b) => {
		const indexA = typeOrder.indexOf(a);
		const indexB = typeOrder.indexOf(b);
		// Якщо тип не знайдено в списку, ставимо його в кінець
		const orderA = indexA === -1 ? typeOrder.length : indexA;
		const orderB = indexB === -1 ? typeOrder.length : indexB;
		return orderA - orderB;
	});

	return (
		<View style={styles.container}>
			{/* Пошкодження */}
			{activeDamages.length > 0 && (
				<View style={styles.subSection}>
					<Text style={styles.subTitle}>Пошкодження:</Text>
					{activeDamages.map((part) => (
						<View key={part.key} style={styles.damageRow}>
							<Text style={styles.damageLabel}>{part.label}</Text>
							<View style={styles.damageSquares}>
								{Array.from({ length: part.value }).map((_, i) => (
									<View key={i} style={styles.damageSquare} />
								))}
							</View>
						</View>
					))}
				</View>
			)}

			{/* Остання дія */}
			<View style={styles.subSectionRow}>
				<Text style={styles.subTitleRow}>Остання дія корабля:</Text>
				<View style={styles.lastActionContainer}>
					<ImageBackground
						source={FateBackgroundImage}
						style={styles.lastActionBackground}
						resizeMode="contain"
					>
						<Text style={styles.lastActionText}>{ship.last_action}</Text>
					</ImageBackground>
				</View>
			</View>

			{/* Наша локація */}
			<View style={styles.subSectionRow}>
				<Text style={styles.subTitleRow}>Наша локація:</Text>
				<View style={styles.locationRow}>
					<Text style={styles.locationText}>{ship.location}</Text>
					<View style={styles.backPage}>
					<Text style={styles.locationPage}>{ship.page}</Text>
					</View>
				</View>
			</View>

			{/* Ресурси */}
			{activeResources.length > 0 && (
				<View style={styles.subSection}>
					<Text style={styles.subTitle}>Ресурси:</Text>
					<View style={styles.resourcesGrid}>
						{activeResources.map((res) => (
							<View key={res.key} style={styles.resourceItem}>
								<ImageBackground
									source={res.key}
									style={styles.resourceBackground}
									resizeMode="cover"
								>
									<Text style={styles.resourceValue}>{res.value}</Text>
								</ImageBackground>
							</View>
						))}
					</View>
				</View>
			)}

			{/* Майно */}
			{allGoods.length > 0 && (
				<View style={styles.subSection}>
					<Text style={styles.subTitle}>Майно:</Text>
					{sortedTypes.map((type) => {
						const items = goodsByType[type];
						return (
							<View key={type} style={styles.goodsGroup}>
								<Text style={styles.goodsType}>{type}</Text>
								{items.map((good) => (
									<View key={good.id} style={styles.goodsItem}>
										<View style={styles.goodsItemRow}>
											{good.isTotem && (
												<View style={styles.totemIcon}>
													<Image
														source={TotemBackgroundImage}
														style={styles.img}
														resizeMode="contain"
													/>
												</View>
											)}
											<Text style={[styles.goodsName, good.isTotem && styles.goodsNameWithIcon]}>
												{good.name}
											</Text>
											{good.activated && (
												<View style={styles.activatedIcon}>
													<Image
														source={CommandCostBackgroundImage}
														style={styles.img}
														resizeMode="center"
													/>
												</View>
											)}
										</View>
									</View>
								))}
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f5f0e8',
		padding: 16,
	},
	subSection: {
		marginBottom: 20,
	},
	subSectionRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 20,
	},
	subTitle: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#777',
		marginBottom: 10,
	},
	subTitleRow: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#777',
		marginRight: 8,
	},
	damageRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		marginBottom: 12,
	},
	damageLabel: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		width: 80,
	},
	damageSquares: {
		flexDirection: 'row',
	},
	damageSquare: {
		width: 24,
		height: 24,
		backgroundColor: '#c70505',
		marginHorizontal: 6,
		borderRadius: 2,
	},
	lastActionContainer: {
		alignItems: 'flex-start',
	},
	lastActionBackground: {
		width: 30,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	lastActionText: {
		color: '#fff',
		fontSize: 24,
		fontFamily: 'Kyiv-Machine',
		textShadowColor: '#000',
		textShadowOffset: { width: 2, height: 1 },
		textShadowRadius: 2,
	},
	locationRow: {
		flexDirection: 'row',
		gap: 16,
	},
	locationText: {
		width: 44,
		height: 44,
		backgroundColor: "#ffc48b",
		borderWidth: 4,
		borderColor: "#bc2b33",
		borderRadius: 22,
		fontSize: 22,
		fontFamily: 'Kyiv-Machine',
		color: '#000',
		textAlign: 'center',
		textAlignVertical: 'center',
	},
	backPage: {
		width: 60,
		height: 44,
		backgroundColor: "#691716",
		borderStyle: 'dashed',
		borderBottomWidth: 1,
		borderTopWidth: 1,
		borderBottomColor: "#c84137",
		borderTopColor: "#c84137",
		justifyContent: 'center',
	},
	locationPage: {
		width: 60,
		height: 36,
		backgroundColor: "#691716",
		borderStyle: 'dashed',
		borderBottomWidth: 1,
		borderTopWidth: 1,
		borderBottomColor: "#c84137",
		borderTopColor: "#c84137",
		fontSize: 24,
		fontFamily: 'Kyiv-Machine',
		color: '#fff',
		textAlign: 'center',
		textAlignVertical: 'center',
	},
	resourcesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 4,
	},
	resourceItem: {
		width: 90,
		height: 90,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: '#f5f0e8',
		flexDirection: 'row',
		alignItems: 'center',
		overflow: 'hidden',
	},
	resourceBackground: {
		width: '100%',
		height: '100%',
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
	},
	resourceValue: {
		fontSize: 40,
		fontFamily: 'Kyiv-Machine',
		color: '#fff',
		margin: 6,
		textShadowColor: '#000',
		textShadowOffset: { width: -2, height: 0 },
		textShadowRadius: 3,
	},
	goodsGroup: {
		marginBottom: 8,
	},
	goodsType: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#691716',
		marginBottom: 4,
	},
	goodsItem: {
		paddingVertical: 2,
	},
	goodsItemRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	totemIcon: {
		width: 20,
		height: 24,
		borderWidth: 1,
		borderColor: '#f5f0e8',
		borderRadius: 7,
		alignItems: 'center',
		overflow: 'hidden',
	},
	goodsName: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginLeft: 25,
	},
	goodsNameWithIcon: {
		marginLeft: 4,
	},
	activatedIcon: {
		width: 20,
		height: 20,
		marginLeft: 6,
	},
	img: {
		width: '100%',
		height: '100%',
	},
});

export default ShipView;