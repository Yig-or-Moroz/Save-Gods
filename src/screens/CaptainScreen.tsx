import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import CharacterEditor, { CharacterEditorRef, CharacterData, CharacterUpdateData } from '../components/CharacterEditor';
import Ionicons from '@expo/vector-icons/Ionicons';

type AbilityCard = {
	id: number;
	name: string;
};

type ExperienceCard = {
	id: number;
	name: string;
	character_name_id: number;
};

const CaptainScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;
	const [isLoading, setIsLoading] = useState(true);
	const [characterData, setCharacterData] = useState<CharacterData | null>(null);
	const [abilityCards, setAbilityCards] = useState<AbilityCard[]>([]);
	const [experienceCards, setExperienceCards] = useState<ExperienceCard[]>([]);
	const editorRef = useRef<CharacterEditorRef>(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				const captainResult = await db.getAllAsync<CharacterData>(
					'SELECT * FROM characters WHERE game_id = ? AND character_name_id = 1;',
					[gameId]
				);
				if (captainResult.length === 0) {
					Alert.alert('Помилка', 'Капітана не знайдено');
					setIsLoading(false);
					return;
				}
				setCharacterData(captainResult[0]);

				const abilityResult = await db.getAllAsync<AbilityCard>(
					'SELECT * FROM ability_cards ORDER BY name;'
				);
				setAbilityCards(abilityResult);

				const expResult = await db.getAllAsync<ExperienceCard>(
					'SELECT * FROM experience_cards WHERE character_name_id = 1 ORDER BY name;'
				);
				setExperienceCards(expResult);
			} catch (error) {
				console.error('Помилка завантаження капітана:', error);
				Alert.alert('Помилка', 'Не вдалося завантажити дані капітана');
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, [gameId]);

	const handleSave = async () => {
		try {
			const updatedData = await editorRef.current?.save();
			if (!updatedData) {
				return;
			}

			await db.runAsync(
				`UPDATE characters SET
          damage = ?,
          fatigue = ?,
          fright = ?,
          madness = ?,
          poisoning = ?,
          weakness = ?,
          low_morale = ?,
          ability_card_id_1 = ?,
          ability_card_id_2 = ?,
          experience_card_id_1 = ?,
          experience_card_id_2 = ?,
          experience_card_id_3 = ?
        WHERE id = ?;`,
				[
					updatedData.damage,
					updatedData.fatigue,
					updatedData.fright,
					updatedData.madness,
					updatedData.poisoning,
					updatedData.weakness,
					updatedData.low_morale,
					updatedData.ability_card_id_1,
					updatedData.ability_card_id_2,
					updatedData.experience_card_id_1,
					updatedData.experience_card_id_2,
					updatedData.experience_card_id_3,
					characterData!.id,
				]
			);

			Alert.alert('Успіх', 'Дані капітана збережено!', [
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

	if (!characterData) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.headerWrapper}>
					<View style={styles.backButtonWrapper}>
						<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
							<Ionicons name="arrow-back" size={22} color="#004d57" />
						</TouchableOpacity>
					</View>
					<View style={styles.titleWrapper}>
						<Text style={styles.header}>Капітан Софі Одеса</Text>
					</View>
				</View>
				<View style={styles.center}>
					<Text style={styles.errorText}>Капітана не знайдено</Text>
				</View>
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
					<Text style={styles.header}>Капітан Софі Одеса</Text>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<CharacterEditor
					ref={editorRef}
					character={characterData}
					abilityCards={abilityCards}
					experienceCards={experienceCards}
				/>

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

export default CaptainScreen;