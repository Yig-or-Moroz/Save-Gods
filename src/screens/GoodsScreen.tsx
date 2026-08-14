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

type ChestState = {
	[goodsId: number]: {
		added: boolean;
		activated: boolean;
	};
};

const GoodsScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [goods, setGoods] = useState<Good[]>([]);
	const [chestState, setChestState] = useState<ChestState>({});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const goodsResult = await db.getAllAsync<Good>(
				'SELECT * FROM goods ORDER BY name;'
			);
			setGoods(goodsResult);

			const chestResult = await db.getAllAsync<ChestGood>(
				'SELECT goods_id, activated FROM chest_goods WHERE game_id = ?;',
				[gameId]
			);

			const initialChestState: ChestState = {};
			chestResult.forEach((item) => {
				initialChestState[item.goods_id] = {
					added: true,
					activated: item.activated === 1,
				};
			});

			const starterGoods = goodsResult.filter((g) => g.type === 'Стартова');
			let updatedChestState = { ...initialChestState };
			let addedCount = 0;

			for (const good of starterGoods) {
				if (!updatedChestState[good.id]) {
					await db.runAsync(
						'INSERT INTO chest_goods (game_id, goods_id, activated) VALUES (?, ?, ?);',
						[gameId, good.id, 0]
					);
					updatedChestState[good.id] = {
						added: true,
						activated: false,
					};
					addedCount++;
				}
			}

			if (addedCount > 0) {
				console.log(`✅ Додано ${addedCount} стартових товарів до скрині`);
			}

			setChestState(updatedChestState);
		} catch (error) {
			console.error('Помилка завантаження майна:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити майно');
		} finally {
			setIsLoading(false);
		}
	};

	const toggleAdd = async (goodId: number) => {
		const good = goods.find((g) => g.id === goodId);
		if (!good || good.type === 'Стартова') {
			Alert.alert('Увага', 'Стартове майно завжди додане до скрині');
			return;
		}

		const current = chestState[goodId];
		const isAdded = current?.added || false;

		try {
			if (isAdded) {
				await db.runAsync(
					'DELETE FROM chest_goods WHERE game_id = ? AND goods_id = ?;',
					[gameId, goodId]
				);
				setChestState((prev) => {
					const newState = { ...prev };
					delete newState[goodId];
					return newState;
				});
			} else {
				await db.runAsync(
					'INSERT INTO chest_goods (game_id, goods_id, activated) VALUES (?, ?, ?);',
					[gameId, goodId, 0]
				);
				setChestState((prev) => ({
					...prev,
					[goodId]: { added: true, activated: false },
				}));
			}
		} catch (error) {
			console.error('Помилка зміни майна:', error);
			Alert.alert('Помилка', 'Не вдалося оновити майно');
		}
	};

	const toggleActivated = async (goodId: number) => {
		const current = chestState[goodId];
		if (!current || !current.added) {
			Alert.alert('Увага', 'Спочатку додайте товар до скрині');
			return;
		}

		const newActivated = !current.activated;
		try {
			await db.runAsync(
				'UPDATE chest_goods SET activated = ? WHERE game_id = ? AND goods_id = ?;',
				[newActivated ? 1 : 0, gameId, goodId]
			);
			setChestState((prev) => ({
				...prev,
				[goodId]: { ...prev[goodId], activated: newActivated },
			}));
		} catch (error) {
			console.error('Помилка активації майна:', error);
			Alert.alert('Помилка', 'Не вдалося змінити стан активації');
		}
	};

	const renderItem = ({ item }: { item: Good }) => {
		const state = chestState[item.id];
		const isAdded = state?.added || false;
		const isActivated = state?.activated || false;
		const isStarter = item.type === 'Стартова';

		return (
			<TouchableOpacity
				style={[styles.goodRow, isStarter && styles.starterRow]}
				onPress={() => toggleAdd(item.id)}
				activeOpacity={0.7}
				disabled={isStarter} // стартові не реагують на натискання (залишаються доданими)
			>
				{/* Чекбокс "Додати" */}
				<View style={[styles.checkbox, isAdded && styles.checkboxChecked, isStarter && styles.checkboxStarter]} />

				<Text style={[styles.goodName, isStarter && styles.starterText]}>
					{item.name}
				</Text>

				{/* Чекбокс "Активовано" з збільшеною зоною натискання */}
				<TouchableOpacity
					style={styles.activateTouchArea}
					onPress={() => toggleActivated(item.id)}
					disabled={!isAdded}
					hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
				>
					<View
						style={[
							styles.checkbox,
							isActivated && styles.checkboxChecked,
							!isAdded && styles.checkboxDisabled,
						]}
					/>
				</TouchableOpacity>
			</TouchableOpacity>
		);
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#004d57" />
				<Text style={styles.loadingText}>Завантаження майна...</Text>
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
					<Text style={styles.header}>Майно</Text>
				</View>
				<View style={styles.subHeader}>
					<Text style={styles.subHeaderText}>Придбано</Text>
					<Text style={styles.subHeaderText}>Активовано</Text>
				</View>
			</View>

			<FlatList
				data={goods}
				keyExtractor={(item) => item.id.toString()}
				renderItem={renderItem}
				contentContainerStyle={styles.listContent}
				ListEmptyComponent={
					<Text style={styles.emptyText}>Немає товарів</Text>
				}
			/>
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
		marginBottom: 8,
	},
	header: {
		fontSize: 28,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		textAlign: 'center',
	},
	subHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	subHeaderText: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	listContent: {
		padding: 20,
	},
	goodRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 16,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	starterRow: {
		backgroundColor: '#f5f0e8',
		borderWidth: 1,
		borderColor: '#691716',
	},
	goodName: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		flex: 1,
		marginHorizontal: 10,
	},
	starterText: {
		color: '#691716',
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#004d57',
		backgroundColor: '#fff',
	},
	checkboxChecked: {
		backgroundColor: '#004d57',
	},
	checkboxStarter: {
		borderColor: '#691716',
		backgroundColor: '#691716',
	},
	checkboxDisabled: {
		borderColor: '#aaa',
		backgroundColor: '#eee',
	},
	activateTouchArea: {
		padding: 0,
		margin: 0,
		// Зона натискання збільшена через hitSlop
	},
	emptyText: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#999',
		textAlign: 'center',
		marginTop: 40,
	},
});

export default GoodsScreen;