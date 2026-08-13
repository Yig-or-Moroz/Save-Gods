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
};

const GoodsScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [goods, setGoods] = useState<Good[]>([]);
	const [chestGoods, setChestGoods] = useState<Set<number>>(new Set());
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			// 1. Отримуємо всі товари
			const goodsResult = await db.getAllAsync<Good>(
				'SELECT * FROM goods ORDER BY name;'
			);
			setGoods(goodsResult);

			// 2. Отримуємо поточні товари в скрині
			const chestResult = await db.getAllAsync<ChestGood>(
				'SELECT goods_id FROM chest_goods WHERE game_id = ?;',
				[gameId]
			);
			const chestSet = new Set(chestResult.map((item) => item.goods_id));

			// 3. Додаємо всі товари з типом "Стартова", яких ще немає в скрині
			const starterGoods = goodsResult.filter((g) => g.type === 'Стартова');
			let updatedChestSet = new Set(chestSet);
			let addedCount = 0;

			for (const good of starterGoods) {
				if (!updatedChestSet.has(good.id)) {
					await db.runAsync(
						'INSERT INTO chest_goods (game_id, goods_id) VALUES (?, ?);',
						[gameId, good.id]
					);
					updatedChestSet.add(good.id);
					addedCount++;
				}
			}

			if (addedCount > 0) {
				console.log(`✅ Додано ${addedCount} стартових товарів до скрині`);
			}

			setChestGoods(updatedChestSet);
		} catch (error) {
			console.error('Помилка завантаження майна:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити майно');
		} finally {
			setIsLoading(false);
		}
	};

	const toggleGood = async (goodId: number) => {
		// Забороняємо знімати відмітку зі стартових товарів
		const good = goods.find((g) => g.id === goodId);
		if (good && good.type === 'Стартова') {
			Alert.alert('Увага', 'Стартове майно не можна видалити зі скрині');
			return;
		}

		const isInChest = chestGoods.has(goodId);
		try {
			if (isInChest) {
				await db.runAsync(
					'DELETE FROM chest_goods WHERE game_id = ? AND goods_id = ?;',
					[gameId, goodId]
				);
				setChestGoods((prev) => {
					const newSet = new Set(prev);
					newSet.delete(goodId);
					return newSet;
				});
			} else {
				await db.runAsync(
					'INSERT INTO chest_goods (game_id, goods_id) VALUES (?, ?);',
					[gameId, goodId]
				);
				setChestGoods((prev) => new Set(prev).add(goodId));
			}
		} catch (error) {
			console.error('Помилка зміни майна:', error);
			Alert.alert('Помилка', 'Не вдалося оновити майно');
		}
	};

	const renderItem = ({ item }: { item: Good }) => {
		const isChecked = chestGoods.has(item.id);
		const isStarter = item.type === 'Стартова';

		return (
			<TouchableOpacity
				style={[styles.goodRow, isStarter && styles.starterRow]}
				onPress={() => toggleGood(item.id)}
				activeOpacity={0.7}
				disabled={isStarter} // Забороняємо натискання на стартові товари
			>
				<View
					style={[
						styles.checkbox,
						isChecked && styles.checkboxChecked,
						isStarter && styles.checkboxStarter,
					]}
				/>
				<Text style={[styles.goodName, isStarter && styles.starterText]}>
					{item.name}
				</Text>
				<Text style={[styles.goodType, isStarter && styles.starterText]}>
					{item.type}
				</Text>
				{isStarter && (
					<Text style={styles.starterBadge}></Text>
				)}
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
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#004d57',
		marginRight: 12,
		backgroundColor: '#fff',
	},
	checkboxChecked: {
		backgroundColor: '#004d57',
	},
	checkboxStarter: {
		borderColor: '#691716',
		backgroundColor: '#691716',
	},
	goodName: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		flex: 1,
	},
	starterText: {
		color: '#691716',
	},
	goodType: {
		fontSize: 14,
		color: '#888',
		fontFamily: 'Kyiv-Machine',
		marginRight: 8,
	},
	starterBadge: {
		fontSize: 18,
		color: '#004d57',
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