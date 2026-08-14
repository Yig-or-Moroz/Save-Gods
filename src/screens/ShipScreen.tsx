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
	location: number;
	meat: number;
	vegetables: number;
	grain: number;
	materials: number;
	artifacts: number;
	coins: number;
};

const ShipScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [ship, setShip] = useState<ShipData | null>(null);

	const [hull, setHull] = useState(0);
	const [deck, setDeck] = useState(0);
	const [hospital, setHospital] = useState(0);
	const [caboose, setCaboose] = useState(0);
	const [cabin, setCabin] = useState(0);
	const [bridge, setBridge] = useState(0);
	const [lastAction, setLastAction] = useState(1);
	const [page, setPage] = useState('');
	const [location, setLocation] = useState('');
	const [meat, setMeat] = useState('');
	const [vegetables, setVegetables] = useState('');
	const [grain, setGrain] = useState('');
	const [materials, setMaterials] = useState('');
	const [artifacts, setArtifacts] = useState('');
	const [coins, setCoins] = useState('');

	useEffect(() => {
		loadShipData();
	}, []);

	const loadShipData = async () => {
		try {
			const result = await db.getAllAsync<ShipData>(
				'SELECT * FROM ships WHERE game_id = ?;',
				[gameId]
			);
			if (result.length === 0) {
				await db.runAsync(
					`INSERT INTO ships (
            game_id, hull, deck, hospital, caboose, cabin, bridge,
            last_action, page, location,
            meat, vegetables, grain, materials, artifacts, coins
          ) VALUES (?, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0);`,
					[gameId]
				);
				const newResult = await db.getAllAsync<ShipData>(
					'SELECT * FROM ships WHERE game_id = ?;',
					[gameId]
				);
				if (newResult.length > 0) {
					setShip(newResult[0]);
					updateStateFromShip(newResult[0]);
				}
			} else {
				setShip(result[0]);
				updateStateFromShip(result[0]);
			}
		} catch (error) {
			console.error('Помилка завантаження корабля:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити дані корабля');
		} finally {
			setIsLoading(false);
		}
	};

	const updateStateFromShip = (data: ShipData) => {
		setHull(data.hull);
		setDeck(data.deck);
		setHospital(data.hospital);
		setCaboose(data.caboose);
		setCabin(data.cabin);
		setBridge(data.bridge);
		setLastAction(data.last_action);
		setPage(data.page.toString());
		setLocation(data.location.toString());
		setMeat(data.meat.toString());
		setVegetables(data.vegetables.toString());
		setGrain(data.grain.toString());
		setMaterials(data.materials.toString());
		setArtifacts(data.artifacts.toString());
		setCoins(data.coins.toString());
	};

	const handleSave = async () => {
		try {
			await db.runAsync(
				`UPDATE ships SET
          hull = ?,
          deck = ?,
          hospital = ?,
          caboose = ?,
          cabin = ?,
          bridge = ?,
          last_action = ?,
          page = ?,
          location = ?,
          meat = ?,
          vegetables = ?,
          grain = ?,
          materials = ?,
          artifacts = ?,
          coins = ?
        WHERE game_id = ?;`,
				[
					hull,
					deck,
					hospital,
					caboose,
					cabin,
					bridge,
					lastAction,
					parseInt(page) || 0,
					parseInt(location) || 0,
					parseInt(meat) || 0,
					parseInt(vegetables) || 0,
					parseInt(grain) || 0,
					parseInt(materials) || 0,
					parseInt(artifacts) || 0,
					parseInt(coins) || 0,
					gameId,
				]
			);
			Alert.alert('Успіх', 'Дані корабля збережено!', [
				{ text: 'ОК', onPress: () => navigation.goBack() }
			]);
		} catch (error) {
			console.error('Помилка збереження:', error);
			Alert.alert('Помилка', 'Не вдалося зберегти дані');
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
					<Text style={styles.header}>Корабель</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={styles.sectionTitle}>Пошкодження:</Text>

				<View style={styles.damageRow}>
					<Text style={styles.damageLabel}>Корпус</Text>
					<TouchableOpacity
						style={[styles.checkboxSmall, hull === 1 && styles.checkboxChecked]}
						onPress={() => setHull(hull === 1 ? 0 : 1)}
					>
						{hull === 1 && <View style={styles.checkmark} />}
					</TouchableOpacity>
				</View>

				<View style={styles.damageRow}>
					<Text style={styles.damageLabel}>Палуба</Text>
					<View style={styles.checkboxGroup}>
						{[1, 2].map((num) => (
							<TouchableOpacity
								key={num}
								style={[styles.checkboxSmall, deck >= num && styles.checkboxChecked]}
								onPress={() => {
									if (deck === num) {
										setDeck(num - 1);
									} else if (deck < num) {
										setDeck(num);
									}
								}}
							>
								{deck >= num && <View style={styles.checkmark} />}
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.damageRow}>
					<Text style={styles.damageLabel}>Шпиталь</Text>
					<View style={styles.checkboxGroup}>
						{[1, 2].map((num) => (
							<TouchableOpacity
								key={num}
								style={[styles.checkboxSmall, hospital >= num && styles.checkboxChecked]}
								onPress={() => {
									if (hospital === num) {
										setHospital(num - 1);
									} else if (hospital < num) {
										setHospital(num);
									}
								}}
							>
								{hospital >= num && <View style={styles.checkmark} />}
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.damageRow}>
					<Text style={styles.damageLabel}>Камбуз</Text>
					<View style={styles.checkboxGroup}>
						{[1, 2].map((num) => (
							<TouchableOpacity
								key={num}
								style={[styles.checkboxSmall, caboose >= num && styles.checkboxChecked]}
								onPress={() => {
									if (caboose === num) {
										setCaboose(num - 1);
									} else if (caboose < num) {
										setCaboose(num);
									}
								}}
							>
								{caboose >= num && <View style={styles.checkmark} />}
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.damageRow}>
					<Text style={styles.damageLabel}>Каюта</Text>
					<View style={styles.checkboxGroup}>
						{[1, 2].map((num) => (
							<TouchableOpacity
								key={num}
								style={[styles.checkboxSmall, cabin >= num && styles.checkboxChecked]}
								onPress={() => {
									if (cabin === num) {
										setCabin(num - 1);
									} else if (cabin < num) {
										setCabin(num);
									}
								}}
							>
								{cabin >= num && <View style={styles.checkmark} />}
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.damageRow}>
					<Text style={styles.damageLabel}>Місток</Text>
					<View style={styles.checkboxGroup}>
						{[1, 2].map((num) => (
							<TouchableOpacity
								key={num}
								style={[styles.checkboxSmall, bridge >= num && styles.checkboxChecked]}
								onPress={() => {
									if (bridge === num) {
										setBridge(num - 1);
									} else if (bridge < num) {
										setBridge(num);
									}
								}}
							>
								{bridge >= num && <View style={styles.checkmark} />}
							</TouchableOpacity>
						))}
					</View>
				</View>

				<Text style={styles.sectionTitle}>Остання дія:</Text>
				<View style={styles.radioGroup}>
					{[1, 2, 3, 4, 5, 6].map((num) => (
						<TouchableOpacity
							key={num}
							style={[styles.radioButton, lastAction === num && styles.radioSelected]}
							onPress={() => setLastAction(num)}
						>
							<Text style={[styles.radioText, lastAction === num && styles.radioTextSelected]}>
								{num}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<Text style={styles.sectionTitle}>Наша локація:</Text>
				<View style={styles.locationRow}>
					<View style={styles.locationInput}>
						<Text style={styles.locationLabel}>сторінка:</Text>
						<TextInput
							style={styles.inputSmall}
							value={page}
							onChangeText={setPage}
							keyboardType="numeric"
							maxLength={6}
						/>
					</View>
					<View style={styles.locationInput}>
						<Text style={styles.locationLabel}>локація:</Text>
						<TextInput
							style={styles.inputSmall}
							value={location}
							onChangeText={setLocation}
							keyboardType="numeric"
							maxLength={6}
						/>
					</View>
				</View>

				<Text style={styles.sectionTitle}>Ресурси:</Text>
				<View style={styles.resourcesGrid}>
					<View style={styles.resourceRow}>
						<Text style={styles.resourceLabelLeft}>м'ясо:</Text>
						<TextInput
							style={styles.inputResource}
							value={meat}
							onChangeText={setMeat}
							keyboardType="numeric"
						/>
						<Text style={styles.resourceLabel}>матеріали:</Text>
						<TextInput
							style={styles.inputResource}
							value={materials}
							onChangeText={setMaterials}
							keyboardType="numeric"
						/>
					</View>
					<View style={styles.resourceRow}>
						<Text style={styles.resourceLabelLeft}>овочі:</Text>
						<TextInput
							style={styles.inputResource}
							value={vegetables}
							onChangeText={setVegetables}
							keyboardType="numeric"
						/>
						<Text style={styles.resourceLabel}>артефакти:</Text>
						<TextInput
							style={styles.inputResource}
							value={artifacts}
							onChangeText={setArtifacts}
							keyboardType="numeric"
						/>
					</View>
					<View style={styles.resourceRow}>
						<Text style={styles.resourceLabelLeft}>зерно:</Text>
						<TextInput
							style={styles.inputResource}
							value={grain}
							onChangeText={setGrain}
							keyboardType="numeric"
						/>
						<Text style={styles.resourceLabel}>монети:</Text>
						<TextInput
							style={styles.inputResource}
							value={coins}
							onChangeText={setCoins}
							keyboardType="numeric"
						/>
					</View>
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
	sectionTitle: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginTop: 16,
		marginBottom: 12,
	},
	damageRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	damageLabel: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		width: 100,
	},
	checkboxGroup: {
		flexDirection: 'row',
	},
	checkboxSmall: {
		width: 28,
		height: 28,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#004d57',
		marginRight: 24,
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: {
		backgroundColor: '#004d57',
	},
	checkmark: {
		width: 20,
		height: 20,
		backgroundColor: '#004d57',
		borderRadius: 2,
	},
	radioGroup: {
		flexDirection: 'row',
		marginBottom: 16,
	},
	radioButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		borderColor: '#004d57',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		marginRight: 8,
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
	locationRow: {
		flexDirection: 'row',
		marginBottom: 16,
		gap: 34,
	},
	locationInput: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	locationLabel: {
		fontSize: 16,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	inputSmall: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 8,
		width: 60,
		fontSize: 16,
		backgroundColor: '#fff',
		textAlign: 'center',
	},
	resourcesGrid: {
		marginBottom: 16,
	},
	resourceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
		gap: 12,
	},
	resourceLabel: {
		fontSize: 16,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
		width: 90,
	},
	resourceLabelLeft: {
		fontSize: 16,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
		width: 70,
	},
	inputResource: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 8,
		width: 60,
		fontSize: 16,
		backgroundColor: '#fff',
		textAlign: 'center',
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

export default ShipScreen;