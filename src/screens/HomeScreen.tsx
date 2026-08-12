import React from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
	SafeAreaView,
} from 'react-native';

const Logo = () => (
	<View style={styles.logoContainer}>
		<Image
			source={require('../../assets/images/logo.png')}
			style={{ width: 300, height: 150 }}
			resizeMode="contain"
		/>
	</View>
);

const HomeScreen = () => {  // ← прибрали navigation
	const handleNewGame = () => {
		alert('Створення нової гри');
		// Тут буде перехід до екрана створення гри
	};

	const handleLoadGame = () => {
		alert('Завантаження збереженої гри');
		// Тут буде список збережених ігор
	};

	const handleSaveGame = () => {
		alert('Збереження поточної гри');
		// Тут буде логіка збереження
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Logo />
				<View style={styles.buttonGroup}>
					<TouchableOpacity
						style={[styles.button, styles.primaryButton]}
						onPress={handleNewGame}
					>
						<Text style={styles.buttonText}>Нова гра</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.secondaryButton]}
						onPress={handleLoadGame}
					>
						<Text style={styles.buttonText}>Завантажити гру</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.secondaryButton]}
						onPress={handleSaveGame}
					>
						<Text style={styles.buttonText}>Зберегти гру</Text>
					</TouchableOpacity>
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
		justifyContent: "space-around",
		alignItems: 'center',
		padding: 20,
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 10,
	},
	buttonGroup: {
		width: '100%',
		maxWidth: 300,
		gap: 16,
	},
	button: {
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	primaryButton: {
		backgroundColor: '#691716',
	},
	secondaryButton: {
		backgroundColor: '#004d57',
	},
	buttonText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#ffffff',
		letterSpacing: 1,
		fontFamily: 'GolosText-Medium',
	},
});

export default HomeScreen;