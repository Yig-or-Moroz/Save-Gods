import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import CharacterEditor, { CharacterEditorRef } from '../components/CharacterEditor';
import Ionicons from '@expo/vector-icons/Ionicons';

const PlayerScreen = ({ navigation, route }: any) => {
	const { gameId, playerId, playerName } = route.params;
	const [characterId, setCharacterId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const editorRef = useRef<CharacterEditorRef>(null);

	useEffect(() => {
		const loadCharacterId = async () => {
			try {
				const result = await db.getAllAsync<{ id: number }>(
					'SELECT id FROM characters WHERE game_id = ? AND player_id = ?;',
					[gameId, playerId]
				);
				if (result.length > 0) {
					setCharacterId(result[0].id);
				}
			} catch (error) {
				console.error('Помилка завантаження персонажа:', error);
			} finally {
				setIsLoading(false);
			}
		};
		loadCharacterId();
	}, [gameId, playerId]);

	const handleSave = async () => {
		try {
			await editorRef.current?.save();
			Alert.alert('Успіх', `Дані персонажа ${playerName} збережено!`, [
				{ text: 'ОК', onPress: () => navigation.goBack() }
			]);
		} catch (error: any) {
			Alert.alert('Помилка', error.message || 'Не вдалося зберегти дані');
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
					<Text style={styles.header}>{playerName}</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				{characterId ? (
					<CharacterEditor ref={editorRef} characterId={characterId} />
				) : (
					<View style={styles.center}>
						<Text style={styles.errorText}>Персонажа не знайдено</Text>
					</View>
				)}

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
		paddingBottom: 20,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40,
	},
	errorText: {
		fontSize: 18,
		color: '#691716',
		fontFamily: 'Kyiv-Machine',
	},
	saveButton: {
		backgroundColor: '#691716',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		marginHorizontal: 20,
		marginTop: 10,
		marginBottom: 20,
	},
	saveButtonText: {
		fontSize: 20,
		color: '#fff',
		fontFamily: 'Kyiv-Machine',
		letterSpacing: 1,
	},
});

export default PlayerScreen;