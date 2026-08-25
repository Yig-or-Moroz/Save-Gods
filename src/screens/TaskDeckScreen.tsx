import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
} from 'react';

import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Alert,
	ActivityIndicator,
	PanResponder,
	Animated,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../database';
import Ionicons from '@expo/vector-icons/Ionicons';

type TaskCard = {
	id: number;
	game_id: number;
	card_number: number;
	done: number;
};

type ZoneType = 'active' | 'used' | 'trash';

type ZoneLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
};

const EMPTY_LAYOUT: ZoneLayout = {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
};

const TaskDeckScreen = ({ navigation, route }: any) => {
	const { gameId } = route.params;

	// ---------------------------------------------------------
	// STATE
	// ---------------------------------------------------------

	const [isLoading, setIsLoading] = useState(true);

	const [activeCards, setActiveCards] = useState<TaskCard[]>([]);
	const [usedCards, setUsedCards] = useState<TaskCard[]>([]);

	const [inputNumber, setInputNumber] = useState('');

	const [draggingCard, setDraggingCard] =
		useState<TaskCard | null>(null);

	const [dropZone, setDropZone] =
		useState<ZoneType | null>(null);

	const [scrollEnabled, setScrollEnabled] =
		useState(true);

	// ---------------------------------------------------------
	// REFS
	// ---------------------------------------------------------

	const activeZoneRef = useRef<View>(null);
	const usedZoneRef = useRef<View>(null);
	const trashZoneRef = useRef<View>(null);

	const dragContainerRef = useRef<View>(null);

	const draggingCardRef = useRef<TaskCard | null>(null);

	const zoneLayoutsRef = useRef<{
		active: ZoneLayout;
		used: ZoneLayout;
		trash: ZoneLayout;
	}>({
		active: EMPTY_LAYOUT,
		used: EMPTY_LAYOUT,
		trash: EMPTY_LAYOUT,
	});

	const dragContainerLayoutRef = useRef<ZoneLayout>(
		EMPTY_LAYOUT
	);

	// Animated position of dragged card
	const dragX = useRef(new Animated.Value(0)).current;
	const dragY = useRef(new Animated.Value(0)).current;

	// ---------------------------------------------------------
	// LOAD CARDS
	// ---------------------------------------------------------
218
	useEffect(() => {
		loadCards();
	}, []);

	const loadCards = async () => {
		try {
			const result = await db.getAllAsync<TaskCard>(
				`
				SELECT *
				FROM task_decks
				WHERE game_id = ?
				ORDER BY card_number;
				`,
				[gameId]
			);

			const active = result.filter(
				(card) => card.done === 0
			);

			const used = result.filter(
				(card) => card.done === 1
			);

			setActiveCards(active);
			setUsedCards(used);
		} catch (error) {
			console.error(
				'Помилка завантаження колоди завдань:',
				error
			);

			Alert.alert(
				'Помилка',
				'Не вдалося завантажити колоду завдань'
			);
		} finally {
			setIsLoading(false);
		}
	};

	// ---------------------------------------------------------
	// ADD CARD
	// ---------------------------------------------------------

	const handleAddCard = async () => {
		const num = parseInt(inputNumber, 10);

		if (
			!inputNumber.trim() ||
			isNaN(num) ||
			num < 1 ||
			num > 218
		) {
			Alert.alert(
				'Помилка',
				'Введіть номер від 1 до 218'
			);
			return;
		}

		const exists = [
			...activeCards,
			...usedCards,
		].some(
			(card) => card.card_number === num
		);

		if (exists) {
			Alert.alert(
				'Помилка',
				`Картка №${num} вже додана`
			);

			setInputNumber('');
			return;
		}

		try {
			const result = await db.runAsync(
				`
				INSERT INTO task_decks
				(game_id, card_number, done)
				VALUES (?, ?, ?);
				`,
				[gameId, num, 0]
			);

			const newCard: TaskCard = {
				id: result.lastInsertRowId,
				game_id: gameId,
				card_number: num,
				done: 0,
			};

			setActiveCards((prev) =>
				[...prev, newCard].sort(
					(a, b) =>
						a.card_number - b.card_number
				)
			);

			setInputNumber('');
		} catch (error) {
			console.error(
				'Помилка додавання картки:',
				error
			);

			Alert.alert(
				'Помилка',
				'Не вдалося додати картку'
			);
		}
	};

	// ---------------------------------------------------------
	// DELETE CARD
	// ---------------------------------------------------------

	const handleDeleteCard = async (
		card: TaskCard
	) => {
		try {
			await db.runAsync(
				'DELETE FROM task_decks WHERE id = ?;',
				[card.id]
			);

			if (card.done === 0) {
				setActiveCards((prev) =>
					prev.filter(
						(c) => c.id !== card.id
					)
				);
			} else {
				setUsedCards((prev) =>
					prev.filter(
						(c) => c.id !== card.id
					)
				);
			}
		} catch (error) {
			console.error(
				'Помилка видалення картки:',
				error
			);

			Alert.alert(
				'Помилка',
				'Не вдалося видалити картку'
			);
		}
	};

	// ---------------------------------------------------------
	// MOVE CARD
	// ---------------------------------------------------------

	const moveCard = async (
		card: TaskCard,
		newDone: 0 | 1
	) => {
		if (card.done === newDone) {
			return;
		}

		try {
			await db.runAsync(
				`
				UPDATE task_decks
				SET done = ?
				WHERE id = ?;
				`,
				[newDone, card.id]
			);

			if (newDone === 0) {
				setUsedCards((prev) =>
					prev.filter(
						(c) => c.id !== card.id
					)
				);

				setActiveCards((prev) =>
					[
						...prev,
						{
							...card,
							done: 0,
						},
					].sort(
						(a, b) =>
							a.card_number -
							b.card_number
					)
				);
			} else {
				setActiveCards((prev) =>
					prev.filter(
						(c) => c.id !== card.id
					)
				);

				setUsedCards((prev) =>
					[
						...prev,
						{
							...card,
							done: 1,
						},
					].sort(
						(a, b) =>
							a.card_number -
							b.card_number
					)
				);
			}
		} catch (error) {
			console.error(
				'Помилка переміщення картки:',
				error
			);

			Alert.alert(
				'Помилка',
				'Не вдалося перемістити картку'
			);
		}
	};

	// ---------------------------------------------------------
	// MEASURE ZONES
	// ---------------------------------------------------------

	const measureZone = (
		zone: ZoneType,
		ref: React.RefObject<View | null>
	) => {
		if (!ref.current) {
			return;
		}

		ref.current.measureInWindow(
			(x, y, width, height) => {
				const layout = {
					x,
					y,
					width,
					height,
				};

				zoneLayoutsRef.current = {
					...zoneLayoutsRef.current,
					[zone]: layout,
				};

			}
		);
	};

	const measureAllZones = () => {
		measureZone(
			'active',
			activeZoneRef
		);

		measureZone(
			'used',
			usedZoneRef
		);

		measureZone(
			'trash',
			trashZoneRef
		);
	};

	// ---------------------------------------------------------
	// MEASURE DRAG CONTAINER
	// ---------------------------------------------------------

	const measureDragContainer = () => {
		if (!dragContainerRef.current) {
			return;
		}

		dragContainerRef.current.measureInWindow(
			(x, y, width, height) => {
				dragContainerLayoutRef.current = {
					x,
					y,
					width,
					height,
				};
			}
		);
	};

	// ---------------------------------------------------------
	// CHECK DROP ZONE
	// ---------------------------------------------------------

	const checkDropZone = useCallback(
		(
			pageX: number,
			pageY: number
		): ZoneType | null => {
			const zones =
				zoneLayoutsRef.current;

			const margin = 35;

			const check = (
				zone: ZoneLayout
			) => {
				return (
					pageX >=
					zone.x - margin &&
					pageX <=
					zone.x +
					zone.width +
					margin &&
					pageY >=
					zone.y - margin &&
					pageY <=
					zone.y +
					zone.height +
					margin
				);
			};

			// Trash first
			if (check(zones.trash)) {
				return 'trash';
			}

			if (check(zones.active)) {
				return 'active';
			}

			if (check(zones.used)) {
				return 'used';
			}

			return null;
		},
		[]
	);

	// ---------------------------------------------------------
	// DROP CARD
	// ---------------------------------------------------------

	const finishDrag = (
		pageX: number,
		pageY: number
	) => {
		const card =
			draggingCardRef.current;

		if (!card) {
			return;
		}

		const zone = checkDropZone(
			pageX,
			pageY
		);

		if (zone === 'trash') {
			Alert.alert(
				'Видалити картку',
				`Видалити картку №${card.card_number}?`,
				[
					{
						text: 'Скасувати',
						style: 'cancel',
					},
					{
						text: 'Видалити',
						style: 'destructive',
						onPress: () => {
							handleDeleteCard(
								card
							);
						},
					},
				]
			);
		} else if (
			zone === 'active' &&
			card.done !== 0
		) {
			moveCard(card, 0);
		} else if (
			zone === 'used' &&
			card.done !== 1
		) {
			moveCard(card, 1);
		}
	};

	// ---------------------------------------------------------
	// PAN RESPONDER
	// ---------------------------------------------------------

	const createPanResponder = (
		card: TaskCard
	) => {
		return PanResponder.create({
			onStartShouldSetPanResponder: () =>
				true,

			onStartShouldSetPanResponderCapture:
				() => true,

			onMoveShouldSetPanResponder: () =>
				true,

			onMoveShouldSetPanResponderCapture:
				() => true,

			onPanResponderGrant: (evt) => {
				const {
					pageX,
					pageY,
				} = evt.nativeEvent;

				// Save card in REF.
				// This is important — we don't
				// depend on React state closure.
				draggingCardRef.current =
					card;

				setDraggingCard(card);

				setDropZone(null);

				setScrollEnabled(false);

				measureAllZones();
				measureDragContainer();

				const container =
					dragContainerLayoutRef.current;

				// Convert screen coordinates
				// to drag-container coordinates.
				const localX =
					pageX -
					container.x -
					38;

				const localY =
					pageY -
					container.y -
					50;

				dragX.setValue(localX);
				dragY.setValue(localY);
			},

			onPanResponderMove: (
				evt,
				gestureState
			) => {
				const {
					pageX,
					pageY,
				} = evt.nativeEvent;

				const container =
					dragContainerLayoutRef.current;

				const localX =
					pageX -
					container.x -
					38;

				const localY =
					pageY -
					container.y -
					50;

				dragX.setValue(localX);
				dragY.setValue(localY);

				const zone =
					checkDropZone(
						pageX,
						pageY
					);

				setDropZone(zone);
			},

			onPanResponderRelease: (
				evt
			) => {
				const {
					pageX,
					pageY,
				} = evt.nativeEvent;


				finishDrag(
					pageX,
					pageY
				);

				draggingCardRef.current =
					null;

				setDraggingCard(null);
				setDropZone(null);
				setScrollEnabled(true);
			},

			onPanResponderTerminate: () => {
				console.log(
					'DRAG TERMINATED'
				);

				draggingCardRef.current =
					null;

				setDraggingCard(null);
				setDropZone(null);
				setScrollEnabled(true);
			},
		});
	};

	// ---------------------------------------------------------
	// CIRCLE
	// ---------------------------------------------------------

	const renderCircle = (
		card: TaskCard
	) => {
		const isActive =
			card.done === 0;

		const isDragging =
			draggingCard?.id === card.id;

		const isAnotherDragging =
			draggingCard &&
			draggingCard.id !== card.id;

		const circleStyle = [
			styles.circle,
			isActive
				? styles.circleActive
				: styles.circleUsed,
		];

		const textStyle = [
			styles.circleText,
			isActive
				? styles.circleTextActive
				: styles.circleTextUsed,
		];

		const panResponder =
			createPanResponder(card);

		return (
			<View
				key={card.id}
				style={[
					circleStyle,
					isDragging &&
					styles.hiddenCircle,
					isAnotherDragging &&
					styles.otherDragging,
				]}
				{...panResponder.panHandlers}
			>
				<Text style={textStyle}>
					{card.card_number}
				</Text>
			</View>
		);
	};

	// ---------------------------------------------------------
	// ZONE
	// ---------------------------------------------------------

	const renderZone = (
		title: string,
		cards: TaskCard[],
		zoneType: 'active' | 'used'
	) => {
		const isActive =
			zoneType === 'active';

		const zoneStyle = [
			styles.zone,
			isActive
				? styles.zoneActive
				: styles.zoneUsed,
			dropZone === zoneType &&
			styles.zoneDropTarget,
		];

		const titleStyle = [
			styles.zoneTitle,
			isActive
				? styles.zoneTitleActive
				: styles.zoneTitleUsed,
		];

		const ref =
			zoneType === 'active'
				? activeZoneRef
				: usedZoneRef;

		return (
			<View
				ref={ref}
				style={zoneStyle}
				onLayout={() => {
					// Wait until layout is ready.
					requestAnimationFrame(() => {
						measureZone(
							zoneType,
							ref
						);
					});
				}}
			>
				<Text style={titleStyle}>
					{title}
				</Text>

				<View style={styles.circlesContainer}>
					{cards.length === 0 && zoneType === 'used' ? (
						<Text style={styles.emptyUsedText}>
							Якщо виконали завдання перетягніть його сюди
						</Text>
					) : (
						cards.map(renderCircle)
					)}
				</View>
			</View>
		);
	};

	// ---------------------------------------------------------
	// DRAGGING COPY
	// ---------------------------------------------------------

	const renderDraggingCopy = () => {
		if (!draggingCard) {
			return null;
		}

		const isActive =
			draggingCard.done === 0;

		const circleStyle = [
			styles.circle,
			isActive ? styles.circleActive : styles.circleUsed,
		];

		const textStyle = [
			styles.circleText,
			isActive
				? styles.circleTextActive
				: styles.circleTextUsed,
		];

		return (
			<Animated.View
				pointerEvents="none"
				style={[
					circleStyle,
					styles.draggingAbsolute,
					{
						transform: [
							{
								translateX:
									dragX,
							},
							{
								translateY:
									dragY,
							},
						],
					},
				]}
			>
				<Text style={textStyle}>
					{
						draggingCard.card_number
					}
				</Text>
			</Animated.View>
		);
	};

	// ---------------------------------------------------------
	// LOADING
	// ---------------------------------------------------------

	if (isLoading) {
		return (
			<SafeAreaView
				style={
					styles.loadingContainer
				}
			>
				<ActivityIndicator
					size="large"
					color="#004d57"
				/>

				<Text
					style={
						styles.loadingText
					}
				>
					Завантаження...
				</Text>
			</SafeAreaView>
		);
	}

	// ---------------------------------------------------------
	// RENDER
	// ---------------------------------------------------------

	return (
		<View
			style={styles.screen}
		>
			<SafeAreaView
				style={styles.container}
			>
				{/* HEADER */}

				<View
					style={
						styles.headerWrapper
					}
				>
					<View
						style={
							styles.backButtonWrapper
						}
					>
						<TouchableOpacity
							onPress={() =>
								navigation.goBack()
							}
							style={
								styles.backButton
							}
						>
							<Ionicons
								name="arrow-back"
								size={22}
								color="#004d57"
							/>
						</TouchableOpacity>
					</View>

					<View
						style={
							styles.titleWrapper
						}
					>
						<Text
							style={
								styles.header
							}
						>
							Колода завдань
						</Text>
					</View>
				</View>

				{/* INPUT */}

				<View
					style={styles.inputRow}
				>
					<TextInput
						style={styles.input}
						value={
							inputNumber
						}
						onChangeText={
							setInputNumber
						}
						keyboardType="numeric"
						placeholder="Введіть номер картки"
						maxLength={3}
					/>

					<TouchableOpacity
						style={
							styles.addButton
						}
						onPress={
							handleAddCard
						}
					>
						<Ionicons
							name="add"
							size={28}
							color="#fff"
						/>
					</TouchableOpacity>


				</View>

				{/* CONTENT */}

				<ScrollView
					style={
						styles.scrollView
					}
					contentContainerStyle={
						styles.scrollContent
					}
					scrollEnabled={
						scrollEnabled
					}
					onContentSizeChange={() => {
						requestAnimationFrame(
							() => {
								measureAllZones();
							}
						);
					}}
				>
					{renderZone(
						'Активні',
						activeCards,
						'active'
					)}

					{renderZone(
						'Використані',
						usedCards,
						'used'
					)}

					<View
						ref={
							trashZoneRef
						}
						style={[
							styles.trashZone,
							dropZone ===
							'trash' &&
							styles.trashZoneActive,
						]}
						onLayout={() => {
							requestAnimationFrame(
								() => {
									measureZone(
										'trash',
										trashZoneRef
									);
								}
							);
						}}
					>
						<Ionicons
							name="trash-outline"
							size={28}
							color={
								dropZone ===
									'trash'
									? '#fff'
									: '#691716'
							}
						/>
					</View>
				</ScrollView>

				{/* DRAG LAYER */}

				<View
					ref={
						dragContainerRef
					}
					pointerEvents="none"
					style={
						styles.dragContainer
					}
					onLayout={() => {
						measureDragContainer();
					}}
				>
					{renderDraggingCopy()}
				</View>
			</SafeAreaView>
		</View>
	);
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#f5f0e8',
	},

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

	// ---------------------------------------------------------
	// HEADER
	// ---------------------------------------------------------

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

	// ---------------------------------------------------------
	// INPUT
	// ---------------------------------------------------------

	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: '#f5f0e8',

	},

	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 10,
		fontSize: 18,
		backgroundColor: '#fff',
		textAlign: 'center',
		fontFamily: 'Kyiv-Machine',
		color: '#004d57',
	},

	addButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#004d57',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 8,
	},

	trashZone: {
		width: "100%",
		height: 120,
		paddingVertical: 8,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f5f0e8',
	},

	trashZoneActive: {
		backgroundColor: '#691716',
	},

	// ---------------------------------------------------------
	// SCROLL
	// ---------------------------------------------------------

	scrollView: {
		flex: 1,
	},

	scrollContent: {
		padding: 16,
		paddingBottom: 40,
	},

	// ---------------------------------------------------------
	// ZONES
	// ---------------------------------------------------------

	zone: {
		paddingVertical: 8,
		minHeight: 80,
		backgroundColor: '#f5f0e8',
		borderBottomWidth: 1,
		borderBottomColor: '#004d57',
	},

	zoneActive: {

	},

	zoneUsed: {
		minHeight: 180,
	},

	zoneDropTarget: {
		backgroundColor: '#d0e0d0',
	},

	zoneTitle: {
		fontSize: 20,
		fontFamily: 'Kyiv-Machine',
		paddingVertical: 6,
		marginBottom: 8,
	},

	zoneTitleActive: {
		color: '#004d57',
	},

	zoneTitleUsed: {
		color: '#555',
	},

	// ---------------------------------------------------------
	// CIRCLES
	// ---------------------------------------------------------

	circlesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
	},

	circle: {
		width: 55,
		height: 55,
		borderRadius: 28,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 12,
	},

	circleActive: {
		borderColor: '#004d57',
		backgroundColor: 'transparent',
	},

	circleUsed: {
		borderColor: '#004d57',
		backgroundColor: '#004d57',
	},

	circleText: {
		fontSize: 22,
		fontFamily: 'Kyiv-Machine',
	},

	circleTextActive: {
		color: '#004d57',
	},

	circleTextUsed: {
		color: '#fff',
	},

	// Original circle is hidden while dragging.
	hiddenCircle: {
		opacity: 0,
	},

	// Other circles become slightly transparent.
	otherDragging: {
		opacity: 0.35,
	},

	// ---------------------------------------------------------
	// DRAGGING
	// ---------------------------------------------------------

	dragContainer: {
		position: 'absolute',
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		zIndex: 9999,
		elevation: 9999,
	},

	draggingAbsolute: {
		position: 'absolute',
		left: 0,
		top: 0,

		opacity: 0.95,

		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 5,
		},
		shadowOpacity: 0.35,
		shadowRadius: 8,

		elevation: 20,

		transform: [
			{
				scale: 1.08,
			},
		],
	},

	emptyUsedText: {
		width: '100%',
		textAlign: 'center',
		paddingVertical: 35,
		paddingHorizontal: 20,
		fontSize: 16,
		color: '#777',
		fontFamily: 'Kyiv-Machine',
	},
});

export default TaskDeckScreen;