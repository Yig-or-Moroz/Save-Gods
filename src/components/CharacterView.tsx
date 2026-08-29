import React from 'react';
import { View, Text, Image, ImageBackground, StyleSheet } from 'react-native';

import DamageBackgroundImage from '../../assets/images/damage-token.webp';
import FatigueBackgroundImage from '../../assets/images/fatigue-token-front.webp';
import FatigueTokensBackgroundImage from '../../assets/images/fatigue-tokens.webp';
import VenomBackgroundImage from '../../assets/images/status-venom.webp';
import MadnessBackgroundImage from '../../assets/images/status-madness.webp';
import WeakenedBackgroundImage from '../../assets/images/status-weakened.webp';
import FrightenedBackgroundImage from '../../assets/images/status-frightened.webp';
import LowMoraleBackgroundImage from '../../assets/images/status-low-morale.webp';
import XPCostBackgroundImage from '../../assets/images/xp-cost.webp';
import AbilityCardBackgroundImage from '../../assets/images/abilityCard.png';

type CharacterData = {
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
	characterName: string;
	abilityCards: AbilityCard[];
	experienceCards: ExperienceCard[];
};

const CharacterView = ({ character, characterName, abilityCards, experienceCards }: Props) => {
	const getAbilityName = (id: number | null) => {
		if (!id) return null;
		const card = abilityCards.find((c) => c.id === id);
		return card ? card.name : null;
	};

	const getExperienceName = (id: number | null) => {
		if (!id) return null;
		const card = experienceCards.find((c) => c.id === id);
		return card ? card.name : null;
	};

	const abilityNames = [
		getAbilityName(character.ability_card_id_1),
		getAbilityName(character.ability_card_id_2),
	].filter(Boolean);

	const experienceIds = [
		character.experience_card_id_1,
		character.experience_card_id_2,
		character.experience_card_id_3,
	];
	const experienceNames = experienceIds.map((id) => getExperienceName(id)).filter(Boolean);

	// Перевіряємо, чи є ушкодження або втома
	const hasDamageOrFatigue = character.damage > 0 || character.fatigue > 0;

	// Перевіряємо, чи є стани
	const hasStates = character.fright === 1 || character.madness === 1 || character.poisoning === 1 ||
		character.weakness === 1 || character.low_morale === 1;

	return (
		<View style={styles.container}>
				{hasDamageOrFatigue && hasStates && (
					<View style={styles.row}>
						{character.damage > 0 && (
								<ImageBackground
									source={DamageBackgroundImage}
									style={styles.damageBackground}
									resizeMode="contain"
								>
									<Text style={styles.labelDamage}>{character.damage}</Text>
								</ImageBackground>
						)}
						{character.fatigue > 0 && (
								<ImageBackground
									source={character.fatigue === 1 ? FatigueBackgroundImage : FatigueTokensBackgroundImage}
									style={styles.fatigueBackground}
									resizeMode="contain"
								/>
						)}
				

				{/* Стани (рядок з іконками) – показуємо тільки якщо є стани */}
						{character.fright === 1 && (
							<View style={styles.iconWithLabel}>
								<Image
									source={FrightenedBackgroundImage}
									style={styles.img}
									resizeMode="contain"
								/>
							</View>
						)}
						{character.madness === 1 && (
							<View style={styles.iconWithLabel}>
								<Image
									source={MadnessBackgroundImage}
									style={styles.img}
									resizeMode="contain"
								/>
							</View>
						)}
						{character.poisoning === 1 && (
							<View style={styles.iconWithLabel}>
								<Image
									source={VenomBackgroundImage}
									style={styles.img}
									resizeMode="contain"
								/>
							</View>
						)}
						{character.weakness === 1 && (
							<View style={styles.iconWithLabel}>
								<Image
									source={WeakenedBackgroundImage}
									style={styles.img}
									resizeMode="contain"
								/>
							</View>
						)}
						{character.low_morale === 1 && (
							<View style={styles.iconWithLabel}>
								<Image
									source={LowMoraleBackgroundImage}
									style={styles.img}
									resizeMode="contain"
								/>
							</View>
						)}
					</View>
				)}
			{/* Повідомлення, якщо немає ні ушкоджень, ні втоми, ні станів */}
			{!hasDamageOrFatigue && !hasStates && character.character_name_id < 5 && (
				<View style={styles.messageContainer}>
					<Text style={styles.noStates}>{characterName} здорова, сповнена сил та енергії і готова до пригод.</Text>
				</View>
			)}

			{!hasDamageOrFatigue && !hasStates && character.character_name_id > 4 && (
				<View style={styles.messageContainer}>
					<Text style={styles.noStates}>{characterName} здоровий, сповнений сил та енергії і готовий до пригод.</Text>
				</View>
			)}

			{/* Картки здібностей */}
			{abilityNames.length > 0 && (
				<View style={styles.section}>
					{abilityNames.map((name, index) => (
						<Text key={index} style={styles.listItem}>
							<Image
								source={AbilityCardBackgroundImage}
								style={styles.abilityCard}
								resizeMode="contain"
							/> {name}
						</Text>
					))}
				</View>
			)}

			{/* Картки досвіду */}
			{experienceNames.length > 0 && (
				<View style={styles.section}>
					{experienceNames.map((name, index) => (
						<Text key={index} style={styles.xpcardText}>
							<Image
								source={XPCostBackgroundImage}
								style={styles.xpcard}
								resizeMode="contain"
							/> {name}
						</Text>
					))}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f5f0e8',
		padding: 16,
		borderRadius: 8,
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		marginBottom: 20,
		flexWrap: 'wrap',
		rowGap: 10,
	},
	damageBackground: {
		width: 60,
		height: 65,
		justifyContent: 'center',
		alignItems: 'center',
	},
	fatigueBackground: {
		width: 80,
		height: 65,
		},
	iconWithLabel: {
		width: 60,
		height: 60,
		},
	img: {
		width: '100%',
		height: '100%',
	},
	labelDamage: {
		fontSize: 32,
		fontFamily: 'Kyiv-Machine',
		color: '#fff',
		textShadowColor: '#000',
		textShadowOffset: { width: 2, height: 1 },
		textShadowRadius: 3,
	},
	messageContainer: {
		alignItems: 'center',
		marginBottom: 20,
	},
	noStates: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
		textAlign: 'center',
	},
	section: {
		marginTop: 8,
	},
	listItem: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#630606',
		marginLeft: 8,
		alignItems: 'center',
	},
	xpcard: {
		width: 26,
		height: 26,

	},
	xpcardText: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#983627',
		marginLeft: 8,
	},
	abilityCard: {
		width: 18,
		height: 26,
		resizeMode: 'center',
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: '#ba5740',
	},
});

export default CharacterView;