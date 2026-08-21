import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

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

const CharacterEditor = forwardRef<CharacterEditorRef, Props>(({ character, abilityCards, experienceCards }, ref) => {
	const [damage, setDamage] = useState(character.damage.toString());
	const [fatigue1, setFatigue1] = useState(character.fatigue >= 1);
	const [fatigue2, setFatigue2] = useState(character.fatigue >= 2);
	const [fright, setFright] = useState(character.fright === 1);
	const [madness, setMadness] = useState(character.madness === 1);
	const [poisoning, setPoisoning] = useState(character.poisoning === 1);
	const [weakness, setWeakness] = useState(character.weakness === 1);
	const [lowMorale, setLowMorale] = useState(character.low_morale === 1);
	const [ability1, setAbility1] = useState<number | null>(character.ability_card_id_1);
	const [ability2, setAbility2] = useState<number | null>(character.ability_card_id_2);

	const [selectedExperienceIds, setSelectedExperienceIds] = useState<Set<number>>(() => {
		const set = new Set<number>();
		if (character.experience_card_id_1) set.add(character.experience_card_id_1);
		if (character.experience_card_id_2) set.add(character.experience_card_id_2);
		if (character.experience_card_id_3) set.add(character.experience_card_id_3);
		return set;
	});

	const toggleFatigue = (index: 1 | 2) => {
		if (index === 1) {
			setFatigue1(!fatigue1);
		} else {
			setFatigue2(!fatigue2);
		}
	};

	useEffect(() => {
		if (fatigue2 && !fatigue1) {
			setFatigue1(true);
		}
	}, [fatigue2]);

	const toggleExperienceCard = (cardId: number) => {
		setSelectedExperienceIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(cardId)) {
				newSet.delete(cardId);
			} else {
				if (newSet.size >= 3) {
					Alert.alert('Увага', 'Можна обрати не більше 3 карток досвіду');
					return prev;
				}
				newSet.add(cardId);
			}
			return newSet;
		});
	};

	const save = async (): Promise<CharacterUpdateData> => {
		const damageValue = parseInt(damage) || 0;
		if (damageValue < 0 || damageValue > 9) {
			throw new Error('Ушкодження мають бути від 0 до 9');
		}

		const fatigueValue = (fatigue1 ? 1 : 0) + (fatigue2 ? 1 : 0);
		const expIds = Array.from(selectedExperienceIds);
		const exp1 = expIds[0] || null;
		const exp2 = expIds[1] || null;
		const exp3 = expIds[2] || null;

		return {
			damage: damageValue,
			fatigue: fatigueValue,
			fright: fright ? 1 : 0,
			madness: madness ? 1 : 0,
			poisoning: poisoning ? 1 : 0,
			weakness: weakness ? 1 : 0,
			low_morale: lowMorale ? 1 : 0,
			ability_card_id_1: ability1,
			ability_card_id_2: ability2,
			experience_card_id_1: exp1,
			experience_card_id_2: exp2,
			experience_card_id_3: exp3,
		};
	};

	useImperativeHandle(ref, () => ({
		save,
	}));

	return (
		<View style={styles.container}>
			<View style={[styles.field, styles.row]}>
				<Text style={styles.label2}>Ушкодження:</Text>
				<TextInput
					style={styles.inputSmall}
					value={damage}
					onChangeText={setDamage}
					keyboardType="numeric"
					maxLength={1}
				/>
			</View>

			<View style={[styles.field, styles.row]}>
				<Text style={styles.label2}>Жетони втоми:</Text>
				<View style={styles.fatigueRow}>
					<TouchableOpacity
						style={styles.checkboxContainer}
						onPress={() => toggleFatigue(1)}
					>
						<View style={[styles.checkbox, fatigue1 && styles.checkboxChecked]} />
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.checkboxContainer}
						onPress={() => toggleFatigue(2)}
					>
						<View style={[styles.checkbox, fatigue2 && styles.checkboxChecked]} />
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.field}>
				<Text style={styles.label}>Стани:</Text>
				<View style={styles.stateRow}>
					<TouchableOpacity style={styles.stateItem} onPress={() => setFright(!fright)}>
						<View style={[styles.checkbox, fright && styles.checkboxChecked]} />
						<Text style={styles.stateLabel}>Переляк</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.stateItem} onPress={() => setMadness(!madness)}>
						<View style={[styles.checkbox, madness && styles.checkboxChecked]} />
						<Text style={styles.stateLabel}>Божевілля</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.stateItem} onPress={() => setPoisoning(!poisoning)}>
						<View style={[styles.checkbox, poisoning && styles.checkboxChecked]} />
						<Text style={styles.stateLabel}>Отруєння</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.stateItem} onPress={() => setWeakness(!weakness)}>
						<View style={[styles.checkbox, weakness && styles.checkboxChecked]} />
						<Text style={styles.stateLabel}>Слабкість</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.stateItem} onPress={() => setLowMorale(!lowMorale)}>
						<View style={[styles.checkbox, lowMorale && styles.checkboxChecked]} />
						<Text style={styles.stateLabel}>Низький моральний дух</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.field}>
				<Text style={styles.label}>Картки здібностей:</Text>
				<View style={styles.pickerContainer}>
					<Picker
						selectedValue={ability1}
						onValueChange={(itemValue) => setAbility1(itemValue)}
						style={styles.picker}
					>
						<Picker.Item label="немає" value={null} />
						{abilityCards.map((card) => (
							<Picker.Item key={card.id} label={card.name} value={card.id} />
						))}
					</Picker>
				</View>
				<View style={styles.pickerContainer}>
					<Picker
						selectedValue={ability2}
						onValueChange={(itemValue) => setAbility2(itemValue)}
						style={styles.picker}
					>
						<Picker.Item label="немає" value={null} />
						{abilityCards.map((card) => (
							<Picker.Item key={card.id} label={card.name} value={card.id} />
						))}
					</Picker>
				</View>
			</View>

			<View style={styles.field}>
				<Text style={styles.label}>Картки досвіду:</Text>
				{experienceCards.length === 0 ? (
					<Text style={styles.emptyText}>Немає карток досвіду для цього персонажа</Text>
				) : (
					experienceCards.map((card) => (
						<TouchableOpacity
							key={card.id}
							style={styles.expRow}
							onPress={() => toggleExperienceCard(card.id)}
						>
							<View style={[styles.checkbox, selectedExperienceIds.has(card.id) && styles.checkboxChecked]} />
							<Text style={styles.expLabel}>{card.name}</Text>
						</TouchableOpacity>
					))
				)}
			</View>
		</View>
	);
});

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
	pickerContainer: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		backgroundColor: '#fff',
		marginBottom: 8,
	},
	picker: {
		height: 60,
		width: '100%',
		color: '#004d57',
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