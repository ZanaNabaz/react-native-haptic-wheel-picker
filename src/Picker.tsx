import React from "react";
import { StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import {
	PanGestureHandler,
	PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedGestureHandler,
	useSharedValue,
	withDecay,
	withSpring,
} from "react-native-reanimated";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import PickerItem from "./PickerItem";

const ITEM_HEIGHT = 40;
const ITEM_WIDTH = 40;
const ITEM_DISTANCE = 0.285;
const WHEEL_HEIGHT_MULTIPLIER = 2.6;

export const SPRING_CONFIG = {
	damping: 40,
	mass: 1,
	stiffness: 500,
	overshootClamping: true,
	restSpeedThreshold: 0.001,
	restDisplacementThreshold: 0.001,
};

interface PickerProps<T> {
	/**
	 * list of items to be displayed
	 */
	data: T[];
	/**
	 * default item to be selected
	 * @default data[0]
	 */
	defaultItem?: T;
	/**
	 * callback function to be called when item changes
	 */
	onItemSelect?: (Value: T) => void;
	/**
	 * style for text
	 * @default {color: 'white', paddingHorizontal: 16, textAlign: 'center'}
	 */
	textStyle?: TextStyle;
	/**
	 * custom render function for item
	 * @default (item) => <Text>{item}</Text>
	 */
	renderItem?: (item: T) => JSX.Element;
	/**
	 * custom key extractor function
	 */
	keyExtractor?: (item: T) => string;
	/**
	 * height of each item
	 * @default 40
	 */
	itemHeight?: number;
	/**
	 * width of each item (only for orizontal picker)
	 * @default 40
	 */
	itemWidth?: number;
	/**
	 * multiplier for distance between items
	 * @default 0.285
	 */
	itemDistanceMultipier?: number;
	/**
	 * multiplier for wheel height
	 * @default 2.6
	 */
	wheelHeightMultiplier?: number;
	/**
	 * style for selector lines
	 * @default {borderBottomWidth: 1, borderTopWidth: 1, borderColor: 'black'}
	 */
	selectorStyle?: ViewStyle;
	/**
	 * Boolean check for end of list
	 * @default undefined}
	 */
	isEndReached?: (Value: Boolean) => Boolean;
	/**
	 * Offset value for isEndReached
	 * @default 10}
	 */
	endOffset?: number;
	/**
	 * Boolean check for horizontal picker
	 * @default {false}
	 * */
	isHorizontal?: boolean;
}

type AnimatedGHContext = {
	startY: number;
	startX: number;
};

const Picker = <T,>({
	data,
	defaultItem,
	onItemSelect,
	textStyle,
	renderItem,
	keyExtractor,
	itemHeight = ITEM_HEIGHT,
	itemWidth = ITEM_WIDTH,
	itemDistanceMultipier = ITEM_DISTANCE,
	wheelHeightMultiplier = WHEEL_HEIGHT_MULTIPLIER,
	selectorStyle,
	isEndReached,
	endOffset = 10,
	isHorizontal = false,
}: PickerProps<T>) => {
	let index = data.findIndex((item) => item === defaultItem);
	index = index === -1 ? 0 : index;

	const optionsIndex = useSharedValue(index);
	const translateY = useSharedValue(optionsIndex.value * -itemHeight);
	const lastIndexY = useSharedValue(index * -itemHeight);
	const maximum = (data.length - 1) * -itemHeight;

	const translateX = useSharedValue(optionsIndex.value * -itemWidth);
	const lastIndexX = useSharedValue(index * -itemWidth);
	const gestureHandler = useAnimatedGestureHandler<
		PanGestureHandlerGestureEvent,
		AnimatedGHContext
	>({
		onStart: (_, ctx) => {
			if (isHorizontal) {
				ctx.startX = optionsIndex.value * -itemWidth;
			} else {
				ctx.startY = optionsIndex.value * -itemHeight;
			}
		},
		onActive: (event, ctx) => {
			if (isHorizontal) {
				translateX.value = Math.min(
					Math.max(ctx.startX + event.translationX, maximum),
					0,
				);
				if (
					translateX.value > lastIndexX.value + itemWidth ||
					translateX.value < lastIndexX.value - itemWidth
				) {
					lastIndexX.value =
						Math.round(translateX.value / -itemWidth) * -itemWidth;
					optionsIndex.value = Math.round(translateX.value / -itemWidth);

					runOnJS(ReactNativeHapticFeedback.trigger)("impactLight");
				}
			} else {
				translateY.value = Math.min(
					Math.max(ctx.startY + event.translationY, maximum),
					0,
				);
				if (
					translateY.value > lastIndexY.value + itemHeight ||
					translateY.value < lastIndexY.value - itemHeight
				) {
					lastIndexY.value =
						Math.round(translateY.value / -itemHeight) * -itemHeight;
					optionsIndex.value = Math.round(translateY.value / -itemHeight);

					runOnJS(ReactNativeHapticFeedback.trigger)("impactLight");
				}
			}
		},
		onEnd: (event) => {
			if (isHorizontal) {
				optionsIndex.value = Math.round(translateX.value / -itemWidth);

				translateX.value = withDecay(
					{
						velocity: event.velocityX,
						deceleration: 0.985,
						clamp: [maximum, 0],
					},
					() => {
						if (onItemSelect) {
							runOnJS(onItemSelect)(
								data[Math.round(translateX.value / -itemHeight)],
							);
						}
						optionsIndex.value = Math.round(translateX.value / -itemHeight);
						if (optionsIndex.value >= data.length - endOffset) {
							if (isEndReached) {
								runOnJS(isEndReached)(true);
							}
						} else {
							if (isEndReached) {
								runOnJS(isEndReached)(false);
							}
						}
						translateX.value = withSpring(
							optionsIndex.value * -itemHeight,
							SPRING_CONFIG,
						);
					},
				);
			} else {
				optionsIndex.value = Math.round(translateY.value / -itemHeight);

				translateY.value = withDecay(
					{
						velocity: event.velocityY,
						deceleration: 0.985,
						clamp: [maximum, 0],
					},
					() => {
						if (onItemSelect) {
							runOnJS(onItemSelect)(
								data[Math.round(translateY.value / -itemHeight)],
							);
						}
						optionsIndex.value = Math.round(translateY.value / -itemHeight);
						if (optionsIndex.value >= data.length - endOffset) {
							if (isEndReached) {
								runOnJS(isEndReached)(true);
							}
						} else {
							if (isEndReached) {
								runOnJS(isEndReached)(false);
							}
						}
						translateY.value = withSpring(
							optionsIndex.value * -itemHeight,
							SPRING_CONFIG,
						);
					},
				);
			}
		},
	});

	return (
		<PanGestureHandler onGestureEvent={gestureHandler}>
			<Animated.View
				style={[
					style.picker,
					{
						alignItems: isHorizontal ? "center" : undefined,
					},
				]}
			>
				<View style={style.picker__offset}>
					{data.map((item, listIndex) => (
						<PickerItem
							key={keyExtractor ? keyExtractor(item) : listIndex}
							item={item}
							index={listIndex}
							translateY={translateY}
							translateX={translateX}
							itemHeight={itemWidth}
							itemWidth={itemWidth}
							textStyle={textStyle}
							renderItem={renderItem}
							itemDistanceMultipier={itemDistanceMultipier}
							wheelHeightMultiplier={wheelHeightMultiplier}
							isHorizontal={isHorizontal}
						/>
					))}
					<View style={[style.selector, selectorStyle]} />
				</View>
			</Animated.View>
		</PanGestureHandler>
	);
};

Picker.defaultProps = {
	defaultItem: undefined,
	onItemSelect: undefined,
	keyExtractor: undefined,
	renderItem: undefined,
	textStyle: undefined,
	itemHeight: ITEM_HEIGHT,
	itemDistanceMultipier: ITEM_DISTANCE,
	wheelHeightMultiplier: WHEEL_HEIGHT_MULTIPLIER,
	selectorStyle: undefined,
};

const style = StyleSheet.create({
	picker: {
		flexDirection: "column",
		height: ITEM_HEIGHT * 5,
	},
	picker_horizontal: {
		alignItems: "center",
		height: ITEM_HEIGHT * WHEEL_HEIGHT_MULTIPLIER,
	},
	picker__offset: {
		top: ITEM_HEIGHT * 2,
	},
	picker__offset_Horizontal: {
		flexDirection: "row",
		top: ITEM_HEIGHT,
	},
	selector: {
		borderBottomWidth: 1,
		borderColor: "white",
		borderTopWidth: 1,
		height: ITEM_HEIGHT,
	},
});

export default Picker;
