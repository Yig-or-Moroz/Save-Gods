import React, { useEffect, useState } from 'react';

import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	FlatList,
	StyleSheet,
	Pressable,
} from 'react-native';

type SelectorOption<T extends string | number> = {
	id: T;
	name: string;
};

type Props<T extends string | number> = {
	value: T | null;
	options: SelectorOption<T>[];
	onChange: (value: T | null) => void;
	placeholder?: string;
	title?: string;
	disabled?: boolean;
};

function AbilitySelector<T extends string | number>({
	value,
	options,
	onChange,
	placeholder = 'немає',
	title = 'Оберіть значення',
	disabled = false,
}: Props<T>) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (disabled) {
			setVisible(false);
		}
	}, [disabled]);

	// =====================================================
	// CURRENT VALUE
	// =====================================================

	const selectedOption = options.find(
		(option) => option.id === value
	);

	const selectedLabel =
		selectedOption?.name ?? placeholder;

	// =====================================================
	// SELECT
	// =====================================================

	const handleSelect = (selectedValue: T | null) => {

		onChange(selectedValue);
		setVisible(false);
	};

	// =====================================================
	// OPEN
	// =====================================================

	const handleOpen = () => {
		if (disabled) {
			return;
		}

		console.log('[AbilitySelector] OPEN');

		setVisible(true);
	};

	// =====================================================
	// CLOSE
	// =====================================================

	const handleClose = () => {

		setVisible(false);
	};

	// =====================================================
	// RENDER ITEM
	// =====================================================

	const renderItem = ({
		item,
	}: {
		item: SelectorOption<T>;
	}) => {
		const selected = item.id === value;

		return (
			<TouchableOpacity
				activeOpacity={0.7}
				style={[
					styles.item,
					selected &&
						styles.itemSelected,
				]}
				onPress={() =>
					handleSelect(item.id)
				}
			>
				<View
					style={
						styles.itemIndicator
					}
				>
					{selected && (
						<View
							style={
								styles.itemIndicatorSelected
							}
						/>
					)}
				</View>

				<Text
					style={[
						styles.itemText,
						selected &&
							styles.itemTextSelected,
					]}
				>
					{item.name}
				</Text>
			</TouchableOpacity>
		);
	};

	// =====================================================
	// UI
	// =====================================================

	return (
		<>
			{/* SELECTOR BUTTON */}

			<TouchableOpacity
				activeOpacity={0.7}
				onPress={handleOpen}
				disabled={disabled}
				style={[
					styles.selector,
					disabled &&
						styles.selectorDisabled,
				]}
			>
				<Text
					numberOfLines={1}
					style={[
						styles.selectorText,
						disabled &&
							styles.selectorTextDisabled,
					]}
				>
					{selectedLabel}
				</Text>

				<Text
					style={[
						styles.arrow,
						disabled &&
							styles.arrowDisabled,
					]}
				>
					▼
				</Text>
			</TouchableOpacity>

			{/* MODAL */}

			<Modal
				visible={visible}
				animationType="fade"
				transparent
				onRequestClose={handleClose}
			>
				<View style={styles.modalOverlay}>

					{/* BACKDROP */}

					<Pressable
						style={
							StyleSheet.absoluteFill
						}
						onPress={handleClose}
					/>

					{/* MODAL */}

					<View
						style={
							styles.modalContainer
						}
					>

						{/* HEADER */}

						<View
							style={
								styles.modalHeader
							}
						>
							<Text
								style={
									styles.modalTitle
								}
							>
								{title}
							</Text>

							<TouchableOpacity
								onPress={
									handleClose
								}
								style={
									styles.closeButton
								}
							>
								<Text
									style={
										styles.closeButtonText
									}
								>
									×
								</Text>
							</TouchableOpacity>
						</View>

						{/* NONE */}

						<TouchableOpacity
							activeOpacity={0.7}
							style={[
								styles.item,
								value === null &&
									styles.itemSelected,
							]}
							onPress={() =>
								handleSelect(null)
							}
						>
							<View
								style={
									styles.itemIndicator
								}
							>
								{value === null && (
									<View
										style={
											styles.itemIndicatorSelected
										}
									/>
								)}
							</View>

							<Text
								style={[
									styles.itemText,
									value === null &&
										styles.itemTextSelected,
								]}
							>
								{placeholder}
							</Text>
						</TouchableOpacity>

						{/* LIST */}

						<FlatList
							data={options}
							keyExtractor={(item) =>
								String(item.id)
							}
							renderItem={
								renderItem
							}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator
							contentContainerStyle={
								styles.listContent
							}
						/>

					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	selector: {
		minHeight: 50,

		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,

		backgroundColor: '#fff',

		paddingHorizontal: 16,

		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',

		marginVertical: 10,
	},

	selectorDisabled: {
		backgroundColor: '#eeeeee',
		borderColor: '#cccccc',
	},

	selectorText: {
		flex: 1,

		fontSize: 18,
		fontFamily: 'Kyiv-Machine',

		color: '#004d57',

		marginRight: 12,
	},

	selectorTextDisabled: {
		color: '#999999',
	},

	arrow: {
		fontSize: 16,
		color: '#004d57',
	},

	arrowDisabled: {
		color: '#999999',
	},

	modalOverlay: {
		flex: 1,

		backgroundColor: 'rgba(0, 0, 0, 0.45)',

		justifyContent: 'center',
		alignItems: 'center',

		paddingHorizontal: 20,
		paddingVertical: 30,
	},

	modalContainer: {
		width: '100%',
		maxHeight: '85%',

		backgroundColor: '#f5f0e8',

		borderRadius: 16,

		overflow: 'hidden',

		borderWidth: 1,
		borderColor: '#004d57',
	},

	modalHeader: {
		minHeight: 64,

		backgroundColor: '#004d57',

		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',

		paddingHorizontal: 16,
	},

	modalTitle: {
		flex: 1,

		fontSize: 21,
		fontFamily: 'Kyiv-Machine',

		color: '#ffffff',
	},

	closeButton: {
		width: 42,
		height: 42,

		borderRadius: 21,

		backgroundColor: '#ffffff',

		alignItems: 'center',
		justifyContent: 'center',

		marginLeft: 12,
	},

	closeButtonText: {
		fontSize: 30,
		lineHeight: 30,

		color: '#004d57',

		fontFamily: 'Arial',
	},

	listContent: {
		paddingBottom: 12,
	},

	item: {
		minHeight: 52,

		flexDirection: 'row',
		alignItems: 'center',

		paddingHorizontal: 16,
		paddingVertical: 10,

		backgroundColor: '#ffffff',

		borderBottomWidth: 1,
		borderBottomColor: '#e3e3e3',
	},

	itemSelected: {
		backgroundColor: '#e4efef',
	},

	itemIndicator: {
		width: 24,
		height: 24,

		borderRadius: 12,

		borderWidth: 2,
		borderColor: '#004d57',

		marginRight: 12,

		alignItems: 'center',
		justifyContent: 'center',
	},

	itemIndicatorSelected: {
		width: 12,
		height: 12,

		borderRadius: 6,

		backgroundColor: '#004d57',
	},

	itemText: {
		flex: 1,

		fontSize: 17,
		fontFamily: 'Kyiv-Machine',

		color: '#004d57',
	},

	itemTextSelected: {
		color: '#004d57',
	},
});

export default AbilitySelector;


