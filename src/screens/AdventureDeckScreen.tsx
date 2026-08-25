import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	ScrollView,
	TextInput,
	FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';

type AdventureCard = {
	id: number;
	game_id: number;
	card_number: number;
	name: string;
	type: string;
	totem: number; // 0 або 1
};

const AdventureDeckScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [cards, setCards] = useState<AdventureCard[]>([]);

	// Стан форми
	const [cardNumber, setCardNumber] = useState('');
	const [cardName, setCardName] = useState('');
	const [cardType, setCardType] = useState('немає');
	const [totem, setTotem] = useState<boolean>(false);

	const typeOptions = ['Зброя', 'Рецепт', 'Спорядження', 'Пасажир', 'Тварина', 'немає'];

	useEffect(() => {
		loadCards();
	}, []);

	const loadCards = async () => {
		try {
			const result = await db.getAllAsync<AdventureCard>(
				'SELECT * FROM adventure_decks WHERE game_id = ? ORDER BY card_number;',
				[gameId]
			);
			setCards(result);
		} catch (error) {
			console.error('Помилка завантаження колоди пригод:', error);
			Alert.alert('Помилка', 'Не вдалося завантажити колоду пригод');
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddCard = async () => {
		const num = parseInt(cardNumber);
		if (!cardNumber.trim() || isNaN(num)) {
			Alert.alert('Помилка', 'Введіть номер картки');
			return;
		}
		if (!cardName.trim()) {
			Alert.alert('Помилка', 'Введіть назву картки');
			return;
		}

		try {
			await db.runAsync(
				`INSERT INTO adventure_decks (game_id, card_number, name, type, totem)
         VALUES (?, ?, ?, ?, ?);`,
				[gameId, num, cardName.trim(), cardType, totem ? 1 : 0]
			);
			// Очищаємо форму
			setCardNumber('');
			setCardName('');
			setCardType('немає');
			setTotem(false);
			// Оновлюємо список
			await loadCards();
		} catch (error) {
			console.error('Помилка додавання картки:', error);
			Alert.alert('Помилка', 'Не вдалося додати картку');
		}
	};

	const handleDeleteCard = (cardId: number, cardName: string) => {
		Alert.alert(
			'Видалити картку',
			`Ви впевнені, що хочете видалити картку "${cardName}"?`,
			[
				{ text: 'Скасувати', style: 'cancel' },
				{
					text: 'Видалити',
					style: 'destructive',
					onPress: async () => {
						try {
							await db.runAsync(
								'DELETE FROM adventure_decks WHERE id = ?;',
								[cardId]
							);
							await loadCards();
						} catch (error) {
							console.error('Помилка видалення картки:', error);
							Alert.alert('Помилка', 'Не вдалося видалити картку');
						}
					},
				},
			]
		);
	};

	const renderCard = ({ item }: { item: AdventureCard }) => (
		<View style={styles.cardItem}>
			<Text style={styles.cardNumber}>{item.card_number}</Text>
			<Text style={styles.cardName}>{item.name}</Text>
			<Text style={styles.cardTotem}>{item.totem === 1 ? '🐾' : ''}</Text>
			<TouchableOpacity
				style={styles.deleteButton}
				onPress={() => handleDeleteCard(item.id, item.name)}
			>
				<Ionicons name="trash-outline" size={22} color="#691716" />
			</TouchableOpacity>
		</View>
	);

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
					<Text style={styles.header}>Колода пригод</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* Форма додавання */}
				<View style={styles.form}>
					<View style={styles.field}>
						<Text style={styles.label}>Номер картки</Text>
						<TextInput
							style={styles.input}
							value={cardNumber}
							onChangeText={setCardNumber}
							keyboardType="numeric"
							placeholder="Введіть номер"
						/>
					</View>

					<View style={styles.field}>
						<Text style={styles.label}>Назва картки</Text>
						<TextInput
							style={styles.input}
							value={cardName}
							onChangeText={setCardName}
							placeholder="Введіть назву"
						/>
					</View>

					<View style={styles.field}>
						<Text style={styles.label}>Тип картки</Text>
						<View style={styles.pickerContainer}>
							<Picker
								selectedValue={cardType}
								onValueChange={(itemValue) => setCardType(itemValue)}
								style={styles.picker}
							>
								{typeOptions.map((type) => (
									<Picker.Item key={type} label={type} value={type} />
								))}
							</Picker>
						</View>
					</View>

					<View style={styles.field}>
						<Text style={styles.label}>🐾Тотем:</Text>
						<View style={styles.radioGroup}>
							<TouchableOpacity
								style={[styles.radioButton, totem === true && styles.radioSelected]}
								onPress={() => setTotem(true)}
							>
								<Text style={[styles.radioText, totem === true && styles.radioTextSelected]}>Так</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.radioButton, totem === false && styles.radioSelected]}
								onPress={() => setTotem(false)}
							>
								<Text style={[styles.radioText, totem === false && styles.radioTextSelected]}>Ні</Text>
							</TouchableOpacity>
						</View>
					</View>

					<TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
						<Text style={styles.addButtonText}>Додати картку пригод</Text>
					</TouchableOpacity>
				</View>

				{/* Список карток */}
				<Text style={styles.listTitle}>Список карток:</Text>
				{cards.length === 0 ? (
					<Text style={styles.emptyText}>Немає карток пригод</Text>
				) : (
					<FlatList
						data={cards}
						keyExtractor={(item) => item.id.toString()}
						renderItem={renderCard}
						scrollEnabled={false}
						contentContainerStyle={styles.listContainer}
					/>
				)}
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
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	form: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	field: {
		marginBottom: 16,
	},
	label: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 6,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 10,
		fontSize: 16,
		backgroundColor: '#fff',
		fontFamily: 'Kyiv-Machine',
	},
	pickerContainer: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		backgroundColor: '#fff',
	},
	picker: {
		height: 60,
		width: '100%',
		color: '#004d57',
	},
	radioGroup: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 6,
	},
	radioButton: {
		paddingVertical: 8,
		paddingHorizontal: 20,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: '#004d57',
		backgroundColor: '#fff',
	},
	radioSelected: {
		backgroundColor: '#004d57',
	},
	radioText: {
		fontSize: 16,
		color: '#004d57',
		fontFamily: 'Kyiv-Machine',
	},
	radioTextSelected: {
		color: '#fff',
	},
	addButton: {
		backgroundColor: '#004d57',
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 8,
	},
	addButtonText: {
		fontSize: 18,
		color: '#fff',
		fontFamily: 'Kyiv-Machine',
		letterSpacing: 1,
	},
	listTitle: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 12,
	},
	listContainer: {
		paddingBottom: 10,
	},
	cardItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	cardNumber: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		width: 50,
	},
	cardName: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		flex: 1,
	},
	cardTotem: {
		fontSize: 16,
		color: '#004d57',
		marginRight: 10,
	},
	deleteButton: {
		padding: 4,
	},
	emptyText: {
		fontSize: 16,
		color: '#999',
		fontFamily: 'Kyiv-Machine',
		textAlign: 'center',
		marginTop: 20,
	},
});

export default AdventureDeckScreen;