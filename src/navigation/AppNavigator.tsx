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
import ShipScreen from '../screens/ShipScreen';
import GoodsScreen from '../screens/GoodsScreen';
import CaptainScreen from '../screens/CaptainScreen';
import PlayerScreen from '../screens/PlayerScreen';

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
				<Stack.Screen name="Ship" component={ShipScreen} />
				<Stack.Screen name="Goods" component={GoodsScreen} />
				<Stack.Screen name="Captain" component={CaptainScreen} />
				<Stack.Screen name="Player" component={PlayerScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}