import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { initDatabase } from './src/database';
import AppNavigator from './src/navigation/AppNavigator';

// Імпорт шрифтів (замініть назви на свої)
import GolosTextRegular from './assets/fonts/GolosText-Regular.ttf';
import GolosTextMedium from './assets/fonts/GolosText-Medium.ttf';
import KyivMachine from './assets/fonts/kyiv-machine.regular.ttf';


// Функція завантаження шрифтів
const loadFonts = async () => {
	await Font.loadAsync({
		'GolosText-Regular': GolosTextRegular,
		'GolosText-Medium': GolosTextMedium,
		'Kyiv-Machine': KyivMachine,
	});
};

export default function App() {
	const [appIsReady, setAppIsReady] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function prepare() {
			try {
				await loadFonts();
				await initDatabase();
				setAppIsReady(true);
			} catch (err: unknown) {
				console.error('❌ Помилка підготовки:', err);
				setError(
					err instanceof Error
						? err.message
						: 'Невідома помилка під час запуску застосунку.'
				);
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

	return <AppNavigator />;
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