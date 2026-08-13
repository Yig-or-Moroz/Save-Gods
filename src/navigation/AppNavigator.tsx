import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
	createStackNavigator,
	CardStyleInterpolators,
} from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import NewGameScreen from '../screens/NewGameScreen';
import SaveGamesScreen from '../screens/SaveGamesScreen';
import GameScreen from '../screens/GameScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
	return (
		<NavigationContainer>
			<Stack.Navigator
				screenOptions={{
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: 'horizontal',
					cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
				}}
			>
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="NewGame" component={NewGameScreen} />
				<Stack.Screen name="SaveGames" component={SaveGamesScreen} />
				<Stack.Screen name="Game" component={GameScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}