import React, { useRef, useState, useEffect } from 'react';

import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	ScrollView,
	TextInput,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../database';

import CharacterEditor, {
	CharacterEditorRef,
	CharacterData,
} from '../components/CharacterEditor';

import AbilitySelector from '../components/AbilitySelector';

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

type PlayerData = {
	id: number;
	game_id: number;
	name: string;

	team_tokens: number;

	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;

	captain: number;
};

type CharacterWithCards = CharacterData & {
	character_name: string;
	experienceCards: ExperienceCard[];
};

const PlayerScreen = ({ navigation, route }: any) => {
	const { gameId, playerId, playerName } = route.params;

	// =====================================================
	// STATE
	// =====================================================

	const [isLoading, setIsLoading] = useState(true);

	const [player, setPlayer] =
		useState<PlayerData | null>(null);

	const [characters, setCharacters] =
		useState<CharacterWithCards[]>([]);

	const [abilityCards, setAbilityCards] =
		useState<AbilityCard[]>([]);

	const [teamTokens, setTeamTokens] =
		useState('');

	const [ability1, setAbility1] =
		useState<number | null>(null);

	const [ability2, setAbility2] =
		useState<number | null>(null);

	const [ability3, setAbility3] =
		useState<number | null>(null);

	const [captain, setCaptain] =
		useState(false);

	// =====================================================
	// REFS / LIFECYCLE
	// =====================================================

	const isMountedRef = useRef(false);

	const saveInProgressRef = useRef(false);

	const characterRefs = useRef<
		{ [key: number]: CharacterEditorRef | null }
	>({});

	// =====================================================
	// LOAD DATA
	// =====================================================

	useEffect(() => {
		isMountedRef.current = true;

		console.log('[PlayerScreen] MOUNT', {
			gameId,
			playerId,
			playerName,
		});

		let cancelled = false;

		const load = async () => {
			console.log('[PlayerScreen] loadData START');

			try {
				// -------------------------------------------------
				// PLAYER
				// -------------------------------------------------

				const playerResult =
					await db.getAllAsync<PlayerData>(
						'SELECT * FROM players WHERE id = ?;',
						[playerId]
					);

				if (
					cancelled ||
					!isMountedRef.current
				) {
					console.log(
						'[PlayerScreen] load cancelled after player query'
					);
					return;
				}

				console.log(
					'[PlayerScreen] player query END'
				);

				if (playerResult.length === 0) {
					Alert.alert(
						'Помилка',
						'Гравця не знайдено'
					);
					return;
				}

				const playerData = playerResult[0];

				setPlayer(playerData);

				setTeamTokens(
					playerData.team_tokens === 0
						? ''
						: playerData.team_tokens.toString()
				);

				setAbility1(
					playerData.ability_card_id_1
				);

				setAbility2(
					playerData.ability_card_id_2
				);

				setAbility3(
					playerData.ability_card_id_3
				);

				setCaptain(
					playerData.captain === 1
				);

				// -------------------------------------------------
				// ABILITY CARDS
				// -------------------------------------------------

				console.log(
					'[PlayerScreen] loading ability cards'
				);

				const abilityResult =
					await db.getAllAsync<AbilityCard>(
						'SELECT * FROM ability_cards ORDER BY name;'
					);

				if (
					cancelled ||
					!isMountedRef.current
				) {
					console.log(
						'[PlayerScreen] load cancelled after ability cards'
					);
					return;
				}

				console.log(
					'[PlayerScreen] ability cards loaded:',
					abilityResult.length
				);

				setAbilityCards(abilityResult);

				// -------------------------------------------------
				// CHARACTERS
				// -------------------------------------------------

				console.log(
					'[PlayerScreen] loading characters'
				);

				const charsResult =
					await db.getAllAsync<CharacterData>(
						'SELECT * FROM characters WHERE player_id = ? ORDER BY id;',
						[playerId]
					);

				if (
					cancelled ||
					!isMountedRef.current
				) {
					console.log(
						'[PlayerScreen] load cancelled after characters'
					);
					return;
				}

				console.log(
					'[PlayerScreen] characters loaded:',
					charsResult.length
				);

				const charsWithCards:
					CharacterWithCards[] = [];

				for (const char of charsResult) {
					if (
						cancelled ||
						!isMountedRef.current
					) {
						console.log(
							'[PlayerScreen] load cancelled inside character loop'
						);
						return;
					}

					// ---------------------------------------------
					// CHARACTER NAME
					// ---------------------------------------------

					const nameResult =
						await db.getAllAsync<{ name: string }>(
							'SELECT name FROM character_names WHERE id = ?;',
							[char.character_name_id]
						);

					if (
						cancelled ||
						!isMountedRef.current
					) {
						console.log(
							'[PlayerScreen] load cancelled after name query'
						);
						return;
					}

					const characterName =
						nameResult.length > 0
							? nameResult[0].name
							: 'Невідомий';

					// ---------------------------------------------
					// EXPERIENCE CARDS
					// ---------------------------------------------

					const expResult =
						await db.getAllAsync<ExperienceCard>(
							'SELECT * FROM experience_cards WHERE character_name_id = ? ORDER BY name;',
							[char.character_name_id]
						);

					if (
						cancelled ||
						!isMountedRef.current
					) {
						console.log(
							'[PlayerScreen] load cancelled after experience query'
						);
						return;
					}

					charsWithCards.push({
						...char,
						character_name: characterName,
						experienceCards: expResult,
					});
				}

				if (
					cancelled ||
					!isMountedRef.current
				) {
					console.log(
						'[PlayerScreen] load cancelled before final state update'
					);
					return;
				}

				setCharacters(charsWithCards);

				console.log(
					'[PlayerScreen] loadData END'
				);

			} catch (error) {
				if (
					cancelled ||
					!isMountedRef.current
				) {
					console.log(
						'[PlayerScreen] load error ignored after unmount'
					);
					return;
				}

				console.error(
					'[PlayerScreen] loadData ERROR:',
					error
				);

				Alert.alert(
					'Помилка',
					'Не вдалося завантажити дані гравця'
				);

			} finally {
				if (
					!cancelled &&
					isMountedRef.current
				) {
					setIsLoading(false);
				}
			}
		};

		load();

		// =====================================================
		// CLEANUP
		// =====================================================

		return () => {
			cancelled = true;
			isMountedRef.current = false;

			console.log('[PlayerScreen] UNMOUNT', {
				gameId,
				playerId,
			});

			characterRefs.current = {};
		};
	}, [gameId, playerId, playerName]);

	// =====================================================
	// CAPTAIN
	// =====================================================

	const handleCaptainToggle = async () => {
		if (!isMountedRef.current) {
			console.log(
				'[PlayerScreen] captain toggle ignored: unmounted'
			);
			return;
		}

		console.log(
			'[PlayerScreen] captain toggle'
		);

		const currentCaptain = captain;

		if (!currentCaptain) {
			try {
				const existingCaptain =
					await db.getAllAsync<{ id: number }>(
						'SELECT id FROM players WHERE game_id = ? AND captain = 1 AND id != ?;',
						[gameId, playerId]
					);

				if (!isMountedRef.current) {
					console.log(
						'[PlayerScreen] captain toggle cancelled after SELECT'
					);
					return;
				}

				if (existingCaptain.length > 0) {
					await db.runAsync(
						'UPDATE players SET captain = 0 WHERE id = ?;',
						[existingCaptain[0].id]
					);
				}

				if (!isMountedRef.current) {
					console.log(
						'[PlayerScreen] captain toggle cancelled after UPDATE'
					);
					return;
				}

			} catch (error) {
				if (!isMountedRef.current) {
					return;
				}

				console.error(
					'[PlayerScreen] captain ERROR:',
					error
				);

				Alert.alert(
					'Помилка',
					'Не вдалося перевірити капітана'
				);

				return;
			}
		}

		if (isMountedRef.current) {
			setCaptain((prev) => !prev);
		}
	};

	// =====================================================
	// SAVE
	// =====================================================

	const handleSave = async () => {
		if (!isMountedRef.current) {
			console.log(
				'[PlayerScreen] SAVE ignored: unmounted'
			);
			return;
		}

		if (saveInProgressRef.current) {
			console.log(
				'[PlayerScreen] SAVE ignored: already in progress'
			);
			return;
		}

		saveInProgressRef.current = true;

		console.log(
			'[PlayerScreen] SAVE START'
		);

		try {
			const teamTokensValue =
				parseInt(teamTokens, 10) || 0;

			// -------------------------------------------------
			// UPDATE PLAYER
			// -------------------------------------------------

			console.log(
				'[PlayerScreen] UPDATE player START'
			);

			await db.runAsync(
				`UPDATE players SET
					team_tokens = ?,
					ability_card_id_1 = ?,
					ability_card_id_2 = ?,
					ability_card_id_3 = ?,
					captain = ?
				WHERE id = ?;`,
				[
					teamTokensValue,
					ability1,
					ability2,
					ability3,
					captain ? 1 : 0,
					playerId,
				]
			);

			console.log(
				'[PlayerScreen] UPDATE player END'
			);

			if (!isMountedRef.current) {
				console.log(
					'[PlayerScreen] SAVE cancelled after player UPDATE'
				);
				return;
			}

			// -------------------------------------------------
			// UPDATE CHARACTERS
			// -------------------------------------------------

			for (const char of characters) {
				if (!isMountedRef.current) {
					console.log(
						'[PlayerScreen] SAVE cancelled inside character loop'
					);
					return;
				}

				console.log(
					`[PlayerScreen] character ${char.id} SAVE START`
				);

				const ref =
					characterRefs.current[char.id];

				if (!ref) {
					console.log(
						`[PlayerScreen] character ${char.id} REF NULL`
					);
					continue;
				}

				const updatedData =
					await ref.save();

				if (!isMountedRef.current) {
					console.log(
						`[PlayerScreen] character ${char.id} save cancelled after editor.save()`
					);
					return;
				}

				console.log(
					`[PlayerScreen] character ${char.id} editor save END`
				);

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
						char.id,
					]
				);

				console.log(
					`[PlayerScreen] character ${char.id} UPDATE DB END`
				);

				if (!isMountedRef.current) {
					console.log(
						`[PlayerScreen] SAVE cancelled after character ${char.id}`
					);
					return;
				}
			}

			if (!isMountedRef.current) {
				console.log(
					'[PlayerScreen] SAVE finished but screen is unmounted'
				);
				return;
			}

			console.log(
				'[PlayerScreen] SAVE END'
			);

			Alert.alert(
				'Успіх',
				'Дані гравця збережено!',
				[
					{
						text: 'ОК',
						onPress: () => {
							if (!isMountedRef.current) {
								console.log(
									'[PlayerScreen] GO BACK ignored: unmounted'
								);
								return;
							}

							console.log(
								'[PlayerScreen] GO BACK'
							);

							navigation.goBack();
						},
					},
				]
			);

		} catch (error: any) {
			if (!isMountedRef.current) {
				console.log(
					'[PlayerScreen] SAVE ERROR ignored after unmount'
				);
				return;
			}

			console.error(
				'[PlayerScreen] SAVE ERROR:',
				error
			);

			Alert.alert(
				'Помилка',
				error?.message ||
					'Не вдалося зберегти дані'
			);

		} finally {
			saveInProgressRef.current = false;

			console.log(
				'[PlayerScreen] SAVE FINALLY'
			);
		}
	};

	// =====================================================
	// LOADING
	// =====================================================

	if (isLoading) {
		return (
			<SafeAreaView
				style={styles.loadingContainer}
			>
				<ActivityIndicator
					size="large"
					color="#004d57"
				/>

				<Text style={styles.loadingText}>
					Завантаження...
				</Text>
			</SafeAreaView>
		);
	}

	// =====================================================
	// PLAYER NOT FOUND
	// =====================================================

	if (!player) {
		return (
			<SafeAreaView
				style={styles.container}
			>
				<View style={styles.headerWrapper}>

					<View
						style={styles.backButtonWrapper}
					>
						<TouchableOpacity
							onPress={() =>
								navigation.goBack()
							}
							style={styles.backButton}
						>
							<Ionicons
								name="arrow-back"
								size={22}
								color="#004d57"
							/>
						</TouchableOpacity>
					</View>

					<View style={styles.titleWrapper}>
						<Text style={styles.header}>
							Гравець
						</Text>
					</View>

				</View>

				<View style={styles.center}>
					<Text style={styles.errorText}>
						Гравця не знайдено
					</Text>
				</View>

			</SafeAreaView>
		);
	}

	// =====================================================
	// MAIN UI
	// =====================================================

	return (
		<SafeAreaView
			style={styles.container}
		>
			<View style={styles.headerWrapper}>

				<View
					style={styles.backButtonWrapper}
				>
					<TouchableOpacity
						onPress={() =>
							navigation.goBack()
						}
						style={styles.backButton}
					>
						<Ionicons
							name="arrow-back"
							size={22}
							color="#004d57"
						/>
					</TouchableOpacity>
				</View>

				<View style={styles.titleWrapper}>
					<Text style={styles.header}>
						{playerName}
					</Text>
				</View>

			</View>

			<ScrollView
				contentContainerStyle={
					styles.scrollContent
				}
			>

				{/* ================================================= */}
				{/* TEAM TOKENS */}
				{/* ================================================= */}

				<View
					style={[
						styles.field,
						styles.row,
					]}
				>
					<Text style={styles.label}>
						Жетони команди:
					</Text>

					<TextInput
						style={styles.inputSmall}
						value={teamTokens}
						onChangeText={setTeamTokens}
						keyboardType="numeric"
						maxLength={2}
						placeholder="0"
					/>
				</View>

				{/* ================================================= */}
				{/* ABILITY CARDS */}
				{/* ================================================= */}

				<View style={styles.field}>

					<Text style={styles.label}>
						Картки здібностей:
					</Text>

					<AbilitySelector
						value={ability1}
						options={abilityCards}
						onChange={setAbility1}
					/>

					<AbilitySelector
						value={ability2}
						options={abilityCards}
						onChange={setAbility2}
					/>

					<AbilitySelector
						value={ability3}
						options={abilityCards}
						onChange={setAbility3}
					/>

				</View>

				{/* ================================================= */}
				{/* CAPTAIN */}
				{/* ================================================= */}

				<View
					style={[
						styles.field,
						styles.row,
					]}
				>
					<Text style={styles.label}>
						Капітан
					</Text>

					<TouchableOpacity
						style={
							styles.checkboxContainer
						}
						onPress={
							handleCaptainToggle
						}
					>
						<View
							style={[
								styles.checkbox,
								captain &&
									styles.checkboxChecked,
							]}
						/>
					</TouchableOpacity>
				</View>

				{/* ================================================= */}
				{/* CHARACTERS */}
				{/* ================================================= */}

				{characters.map((char) => (
					<View
						key={char.id}
						style={
							styles.characterBlock
						}
					>
						<Text
							style={
								styles.characterName
							}
						>
							{char.character_name}
						</Text>

						<CharacterEditor
							ref={(ref) => {
								characterRefs.current[
									char.id
								] = ref;
							}}
							character={char}
							abilityCards={
								abilityCards
							}
							experienceCards={
								char.experienceCards
							}
						/>
					</View>
				))}

				{/* ================================================= */}
				{/* SAVE */}
				{/* ================================================= */}

				<TouchableOpacity
					style={styles.saveButton}
					onPress={handleSave}
				>
					<Text
						style={
							styles.saveButtonText
						}
					>
						Зберегти
					</Text>
				</TouchableOpacity>

			</ScrollView>
		</SafeAreaView>
	);
};

// =====================================================
// STYLES
// =====================================================

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

	field: {
		marginBottom: 20,
	},

	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},

	label: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginLeft: 8,
		marginBottom: 8,
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
		fontFamily: 'Kyiv-Machine',
	},

	checkboxContainer: {
		padding: 4,
	},

	checkbox: {
		width: 28,
		height: 28,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: '#004d57',
		backgroundColor: '#fff',
	},

	checkboxChecked: {
		backgroundColor: '#004d57',
	},

	characterBlock: {
		marginBottom: 20,
		backgroundColor: '#fff',
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},

	characterName: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 12,
		textAlign: 'center',
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
		marginTop: 20,
		marginBottom: 10,
	},

	saveButtonText: {
		fontSize: 20,
		color: '#fff',
		fontFamily: 'Kyiv-Machine',
		letterSpacing: 1,
	},
});

export default PlayerScreen;

