import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { initDatabase } from './src/database';
import HomeScreen from './src/screens/HomeScreen';

// Імпорт шрифтів (замініть назви на свої)
import GolosTextRegular from './assets/fonts/GolosText-Regular.ttf';
import GolosTextMedium from './assets/fonts/GolosText-Medium.ttf';

// Функція завантаження шрифтів
const loadFonts = async () => {
	await Font.loadAsync({
		'GolosText-Regular': GolosTextRegular,
		'GolosText-Medium': GolosTextMedium,
	});
};

export default function App() {
	const [appIsReady, setAppIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function prepare() {
			try {
				// Завантажуємо шрифти
				await loadFonts();
				// Ініціалізуємо базу даних
				await initDatabase();
				// Все готово
				setAppIsReady(true);
			} catch (err: any) {
				console.error('❌ Помилка підготовки:', err);
				setError(err.message);
			}
		}

		prepare();
	}, []);

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={styles.error}>Помилка: {error}</Text>
			</View>
		);
	}

	if (!appIsReady) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text style={styles.loadingText}>Завантаження...</Text>
			</View>
		);
	}

	return <HomeScreen />;
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#1a1a2e',
	},
	error: {
		color: 'red',
		fontSize: 16,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#e0e0e0',
	},
});