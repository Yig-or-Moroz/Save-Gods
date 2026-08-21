import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }: any) => {  // ← додаємо navigation


	const handleNewGame = () => {
		navigation.navigate('NewGame');  // ← перехід на екран створення гри
	};

	const handleLoadGame = () => {
		alert('Завантаження збереженої гри');
	};

	const handleSaveGame = () => {
		navigation.navigate('SaveGames');
	};

	return (
		<SafeAreaView style={styles.container}>
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
						<TouchableOpacity style={styles.button} onPress={handleNewGame}>
							<Text style={styles.buttonText}>Нова гра</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.button} onPress={handleLoadGame}>
							<Text style={styles.buttonText}>Завантажити гру</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.button} onPress={handleSaveGame}>
							<Text style={styles.buttonText}>Зберегти гру</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
};


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#e8ddc9',
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
		height: '100%',          // займає всю висоту контейнера
		resizeMode: 'contain',
	},
	buttonWrapper: {
		flex: 1,                 // займає весь вільний простір після логотипу
		width: '100%',
		justifyContent: 'center', // центруємо дочірній buttonGroup по вертикалі
		alignItems: 'center',
	},
	buttonGroup: {
		width: '100%',
		maxWidth: 300,
		gap: 16,
		paddingBottom: 20,      // невеликий відступ знизу (опціонально)
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