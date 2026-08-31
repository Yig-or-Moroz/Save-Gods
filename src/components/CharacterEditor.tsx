import React, {
	useState,
	useEffect,
	useImperativeHandle,
	forwardRef,
} from 'react';

import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TextInput,
} from 'react-native';

import AbilitySelector from './AbilitySelector';

export type CharacterData = {
	id: number;
	game_id: number;
	player_id: number;
	character_name_id: number;

	damage: number;
	fatigue: number;
	fright: number;
	madness: number;
	poisoning: number;
	weakness: number;
	low_morale: number;

	ability_card_id_1: number | null;
	ability_card_id_2: number | null;

	experience_card_id_1: number | null;
	experience_card_id_2: number | null;
	experience_card_id_3: number | null;
};

export type CharacterUpdateData = {
	damage: number;
	fatigue: number;
	fright: number;
	madness: number;
	poisoning: number;
	weakness: number;
	low_morale: number;

	ability_card_id_1: number | null;
	ability_card_id_2: number | null;

	experience_card_id_1: number | null;
	experience_card_id_2: number | null;
	experience_card_id_3: number | null;
};

type AbilityCard = {
	id: number;
	name: string;
};

type ExperienceCard = {
	id: number;
	name: string;
	character_name_id: number;
};

type Props = {
	character: CharacterData;
	abilityCards: AbilityCard[];
	experienceCards: ExperienceCard[];
};

export type CharacterEditorRef = {
	save: () => Promise<CharacterUpdateData>;
};

const CharacterEditor = forwardRef<CharacterEditorRef, Props>(
	(
		{
			character,
			abilityCards,
			experienceCards,
		},
		ref
	) => {
		// =================================================
		// STATE
		// =================================================

		const [damage, setDamage] = useState(
			character.damage === 0
				? ''
				: character.damage.toString()
		);

		const [fatigue1, setFatigue1] =
			useState(
				character.fatigue >= 1
			);

		const [fatigue2, setFatigue2] =
			useState(
				character.fatigue >= 2
			);

		const [fright, setFright] =
			useState(
				character.fright === 1
			);

		const [madness, setMadness] =
			useState(
				character.madness === 1
			);

		const [poisoning, setPoisoning] =
			useState(
				character.poisoning === 1
			);

		const [weakness, setWeakness] =
			useState(
				character.weakness === 1
			);

		const [lowMorale, setLowMorale] =
			useState(
				character.low_morale === 1
			);

		const [ability1, setAbility1] =
			useState<number | null>(
				character.ability_card_id_1
			);

		const [ability2, setAbility2] =
			useState<number | null>(
				character.ability_card_id_2
			);

		const [
			selectedExperienceIds,
			setSelectedExperienceIds,
		] = useState<Set<number>>(() => {
			const set = new Set<number>();

			if (
				character.experience_card_id_1
			) {
				set.add(
					character.experience_card_id_1
				);
			}

			if (
				character.experience_card_id_2
			) {
				set.add(
					character.experience_card_id_2
				);
			}

			if (
				character.experience_card_id_3
			) {
				set.add(
					character.experience_card_id_3
				);
			}

			return set;
		});

		// =================================================
		// FATIGUE
		// =================================================

		const toggleFatigue = (
			index: 1 | 2
		) => {
			if (index === 1) {
				setFatigue1(
					(prev) => !prev
				);
			} else {
				setFatigue2(
					(prev) => !prev
				);
			}
		};

		useEffect(() => {
			if (
				fatigue2 &&
				!fatigue1
			) {
				setFatigue1(true);
			}
		}, [
			fatigue1,
			fatigue2,
		]);

		// =================================================
		// EXPERIENCE CARDS
		// =================================================

		const toggleExperienceCard = (
			cardId: number
		) => {
			setSelectedExperienceIds(
				(prev) => {
					const newSet =
						new Set(prev);

					if (
						newSet.has(cardId)
					) {
						newSet.delete(
							cardId
						);
					} else {
						if (
							newSet.size >= 3
						) {
							Alert.alert(
								'Увага',
								'Можна обрати не більше 3 карток досвіду'
							);

							return prev;
						}

						newSet.add(cardId);
					}

					return newSet;
				}
			);
		};

		// =================================================
		// SAVE
		// =================================================

		const save = async (): Promise<CharacterUpdateData> => {
			console.log(
				`[CharacterEditor ${character.id}] save START`
			);

			const damageValue =
				parseInt(
					damage,
					10
				) || 0;

			if (
				damageValue < 0 ||
				damageValue > 9
			) {
				throw new Error(
					'Ушкодження мають бути від 0 до 9'
				);
			}

			const fatigueValue =
				(fatigue1 ? 1 : 0) +
				(fatigue2 ? 1 : 0);

			const expIds =
				Array.from(
					selectedExperienceIds
				);

			const exp1 =
				expIds[0] || null;

			const exp2 =
				expIds[1] || null;

			const exp3 =
				expIds[2] || null;

			const result: CharacterUpdateData = {
				damage: damageValue,
				fatigue: fatigueValue,

				fright: fright ? 1 : 0,
				madness: madness ? 1 : 0,
				poisoning: poisoning ? 1 : 0,
				weakness: weakness ? 1 : 0,
				low_morale:
					lowMorale ? 1 : 0,

				ability_card_id_1:
					ability1,

				ability_card_id_2:
					ability2,

				experience_card_id_1:
					exp1,

				experience_card_id_2:
					exp2,

				experience_card_id_3:
					exp3,
			};

			console.log(
				`[CharacterEditor ${character.id}] save END`
			);

			return result;
		};

		useImperativeHandle(
			ref,
			() => ({
				save,
			}),
			[
				damage,
				fatigue1,
				fatigue2,
				fright,
				madness,
				poisoning,
				weakness,
				lowMorale,
				ability1,
				ability2,
				selectedExperienceIds,
			]
		);

		// =================================================
		// UI
		// =================================================

		return (
			<View style={styles.container}>

				{/* ========================================= */}
				{/* DAMAGE */}
				{/* ========================================= */}

				<View
					style={[
						styles.field,
						styles.row,
					]}
				>
					<Text
						style={styles.label2}
					>
						Ушкодження:
					</Text>

					<TextInput
						style={
							styles.inputSmall
						}
						value={damage}
						onChangeText={
							setDamage
						}
						keyboardType="numeric"
						maxLength={1}
						placeholder="0"
					/>
				</View>

				{/* ========================================= */}
				{/* FATIGUE */}
				{/* ========================================= */}

				<View
					style={[
						styles.field,
						styles.row,
					]}
				>
					<Text
						style={styles.label2}
					>
						Жетони втоми:
					</Text>

					<View
						style={
							styles.fatigueRow
						}
					>
						<TouchableOpacity
							style={
								styles.checkboxContainer
							}
							onPress={() =>
								toggleFatigue(
									1
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									fatigue1 &&
										styles.checkboxChecked,
								]}
							/>
						</TouchableOpacity>

						<TouchableOpacity
							style={
								styles.checkboxContainer
							}
							onPress={() =>
								toggleFatigue(
									2
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									fatigue2 &&
										styles.checkboxChecked,
								]}
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* ========================================= */}
				{/* STATES */}
				{/* ========================================= */}

				<View style={styles.field}>

					<Text
						style={styles.label}
					>
						Стани:
					</Text>

					<View
						style={
							styles.stateRow
						}
					>

						<TouchableOpacity
							style={
								styles.stateItem
							}
							onPress={() =>
								setFright(
									(prev) =>
										!prev
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									fright &&
										styles.checkboxChecked,
								]}
							/>

							<Text
								style={
									styles.stateLabel
								}
							>
								Переляк
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={
								styles.stateItem
							}
							onPress={() =>
								setMadness(
									(prev) =>
										!prev
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									madness &&
										styles.checkboxChecked,
								]}
							/>

							<Text
								style={
									styles.stateLabel
								}
							>
								Божевілля
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={
								styles.stateItem
							}
							onPress={() =>
								setPoisoning(
									(prev) =>
										!prev
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									poisoning &&
										styles.checkboxChecked,
								]}
							/>

							<Text
								style={
									styles.stateLabel
								}
							>
								Отруєння
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={
								styles.stateItem
							}
							onPress={() =>
								setWeakness(
									(prev) =>
										!prev
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									weakness &&
										styles.checkboxChecked,
								]}
							/>

							<Text
								style={
									styles.stateLabel
								}
							>
								Слабкість
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={
								styles.stateItem
							}
							onPress={() =>
								setLowMorale(
									(prev) =>
										!prev
								)
							}
						>
							<View
								style={[
									styles.checkbox,
									lowMorale &&
										styles.checkboxChecked,
								]}
							/>

							<Text
								style={
									styles.stateLabel
								}
							>
								Низький моральний дух
							</Text>
						</TouchableOpacity>

					</View>
				</View>

				{/* ========================================= */}
				{/* ABILITY CARDS */}
				{/* ========================================= */}

				<View style={styles.field}>

					<Text
						style={styles.label}
					>
						Картки здібностей:
					</Text>

					<AbilitySelector
						value={ability1}
						options={
							abilityCards
						}
						onChange={
							setAbility1
						}
					/>

					<AbilitySelector
						value={ability2}
						options={
							abilityCards
						}
						onChange={
							setAbility2
						}
					/>

				</View>

				{/* ========================================= */}
				{/* EXPERIENCE CARDS */}
				{/* ========================================= */}

				<View style={styles.field}>

					<Text
						style={styles.label}
					>
						Картки досвіду:
					</Text>

					{
						experienceCards.length ===
						0 ? (
							<Text
								style={
									styles.emptyText
								}
							>
								Немає карток досвіду для цього персонажа
							</Text>
						) : (
							experienceCards.map(
								(card) => (
									<TouchableOpacity
										key={
											card.id
										}
										style={
											styles.expRow
										}
										onPress={() =>
											toggleExperienceCard(
												card.id
											)
										}
									>
										<View
											style={[
												styles.checkbox,
												selectedExperienceIds.has(
													card.id
												) &&
													styles.checkboxChecked,
											]}
										/>

										<Text
											style={
												styles.expLabel
											}
										>
											{
												card.name
											}
										</Text>
									</TouchableOpacity>
								)
							)
						)
					}

				</View>

			</View>
		);
	}
);

const styles = StyleSheet.create({
	container: {
		padding: 20,
		paddingBottom: 10,
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
		marginBottom: 12,
	},

	label2: {
		fontSize: 18,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},
	abilityCardSelector: {

	},
	inputSmall: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 8,
		width: 40,
		fontSize: 16,
		backgroundColor: '#fff',
		textAlign: 'center',
		fontFamily: 'Kyiv-Machine',
	},

	fatigueRow: {
		flexDirection: 'row',
		gap: 12,
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

	stateRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
	},

	stateItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
	},

	stateLabel: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginLeft: 6,
	},

	expRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},

	expLabel: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginLeft: 8,
	},

	emptyText: {
		fontSize: 16,
		color: '#999',
		fontFamily: 'Kyiv-Machine',
	},
});

export default CharacterEditor;

