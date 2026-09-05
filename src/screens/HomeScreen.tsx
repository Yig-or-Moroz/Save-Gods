import React from 'react';

import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }: any) => {
	const handleNewGame = () => {
		navigation.navigate('NewGame');
	};

	const handleLoadGame = () => {
		navigation.navigate('LoadGame');
	};

	const handleSaveGame = () => {
		navigation.navigate('SaveGames');
	};

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={[
					'#01878a',
					'#0dc1c3',
					'#08464f',
				]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				style={styles.gradient}
			>
				<SafeAreaView style={styles.safeArea}>
					<View style={styles.content}>
						<View style={styles.logoContainer}>
							<Image
								source={require('../../assets/images/logo.png')}
								style={styles.img}
								resizeMode="contain"
							/>
						</View>

						<View style={styles.buttonWrapper}>
							<View style={styles.buttonGroup}>
								<TouchableOpacity
									style={styles.button}
									onPress={handleNewGame}
								>
									<Text style={styles.buttonText}>
										Нова гра
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.button}
									onPress={handleLoadGame}
								>
									<Text style={styles.buttonText}>
										Розкласти гру
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.button}
									onPress={handleSaveGame}
								>
									<Text style={styles.buttonText}>
										Зберегти гру
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</SafeAreaView>
			</LinearGradient>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	gradient: {
		flex: 1,
	},

	safeArea: {
		flex: 1,
	},

	content: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 30,
		paddingVertical: 100,
	},

	logoContainer: {
		width: '100%',
		height: 120,
	},

	img: {
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},

	buttonWrapper: {
		flex: 1,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},

	buttonGroup: {
		width: '100%',
		maxWidth: 300,
		gap: 16,
		paddingBottom: 20,
	},

	button: {
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#004d57',
	},

	buttonText: {
		fontSize: 20,
		color: '#ffffff',
		letterSpacing: 1,
		fontFamily: 'Kyiv-Machine',
	},
});

export default HomeScreen;