import React from 'react';

import {
	View,
	Text,
	Image,
	ImageBackground,
	StyleSheet,
} from 'react-native';

import CharacterView from './CharacterView';

import CommandTokenBackgroundImage from '../../assets/images/command-token.webp';
import AbilityCardBackgroundImage from '../../assets/images/abilityCard.png';

type PlayerData = {
	id: number;
	name: string;
	team_tokens: number;
	ability_card_id_1: number | null;
	ability_card_id_2: number | null;
	ability_card_id_3: number | null;
};

type CharacterData = {
	id: number;
	game_id: number;
	player_id: number | null;
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
	name: string;
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
	player: PlayerData;
	characters: CharacterData[];
	abilityCards: AbilityCard[];
	experienceCards: ExperienceCard[];
};

const PlayerView = ({
	player,
	characters,
	abilityCards,
	experienceCards,
}: Props) => {
	const getAbilityName = (id: number | null) => {
		if (!id) return null;

		const card = abilityCards.find((item) => item.id === id);

		return card ? card.name : null;
	};

	const abilityNames = [
		getAbilityName(player.ability_card_id_1),
		getAbilityName(player.ability_card_id_2),
		getAbilityName(player.ability_card_id_3),
	].filter((name): name is string => Boolean(name));

	const playerCharacters = characters.filter(
		(character) => character.player_id === player.id
	);

	return (
		<View style={styles.container}>
			{player.team_tokens > 0 && (
				<View style={styles.tokensContainer}>
					<ImageBackground
						source={CommandTokenBackgroundImage}
						style={styles.tokenBackground}
						resizeMode="contain"
					>
						<Text style={styles.tokenText}>
							{player.team_tokens}
						</Text>
					</ImageBackground>
				</View>
			)}

			{abilityNames.length > 0 && (
				<View style={styles.section}>
					{abilityNames.map((name, index) => (
						<Text
							key={`${player.id}-ability-${index}`}
							style={styles.listItem}
						>
							<Image
								source={AbilityCardBackgroundImage}
								style={styles.abilityCard}
								resizeMode="contain"
							/>{' '}
							{name}
						</Text>
					))}
				</View>
			)}

			{playerCharacters.length > 0 ? (
				playerCharacters.map((character) => (
					<View
						key={character.id}
						style={styles.characterBlock}
					>
						<Text style={styles.characterName}>
							{character.name}
						</Text>

						<CharacterView
							character={character}
							characterName={character.name}
							abilityCards={abilityCards}
							experienceCards={experienceCards}
						/>
					</View>
				))
			) : (
				<Text style={styles.noCharacters}>
					У гравця немає персонажів
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f5f0e8',
		paddingVertical: 16,
		borderRadius: 8,
	},

	tokensContainer: {
		alignItems: 'center',
		marginBottom: 12,
	},

	tokenBackground: {
		width: 70,
		height: 70,
		alignItems: 'center',
		justifyContent: 'center',
	},

	tokenText: {
		fontSize: 46,
		fontFamily: 'Kyiv-Machine',
		color: '#fff',
		marginBottom: 16,
		textShadowColor: '#000',
		textShadowOffset: { width: 2, height: 0 },
		textShadowRadius: 3,
	},

	section: {
		marginTop: 8,
		marginLeft: 16,
	},

	listItem: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		color: '#630606',
		marginLeft: 8,
		alignItems: 'center',
	},

	abilityCard: {
		width: 18,
		height: 26,
		resizeMode: 'center',
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: '#ba5740',
	},

	characterBlock: {
		marginTop: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#ccc',
	},

	characterName: {
		fontSize: 22,
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
		marginBottom: 12,
		textAlign: 'center',
	},

	noCharacters: {
		fontSize: 16,
		fontFamily: 'Kyiv-Machine',
		color: '#888',
		textAlign: 'center',
		marginTop: 8,
	},
});

export default PlayerView;