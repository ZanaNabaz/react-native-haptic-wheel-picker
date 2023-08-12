import React, { useState } from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";

interface PickerItemProps<T> {
	item: T;
	index: number;
	translateY: { value: number };
	translateX: { value: number };
	itemHeight: number;
	itemWidth: number;
	textStyle?: TextStyle;
	renderItem?: (item: T) => JSX.Element;
	itemDistanceMultipier: number;
	wheelHeightMultiplier: number;
	isHorizontal: boolean;
}

const calcValue = (
	translateValue: number,

	offset: number,
	itemSize: number,
	itemDistanceMultipier: number,
) => {
	"worklet";

	return Math.sin(
		Math.max(
			Math.min(
				(translateValue + offset) / (itemSize / itemDistanceMultipier),
				Math.PI * 0.5,
			),
			-Math.PI * 0.5,
		),
	);
};

const PickerItem = <T,>({
	item,
	index,
	translateY,
	translateX,
	itemHeight,
	itemWidth,
	textStyle,
	renderItem,
	itemDistanceMultipier,
	wheelHeightMultiplier,
	isHorizontal,
}: PickerItemProps<T>) => {
	const [width, setWidth] = useState(0);
	const offset = index * itemHeight;
	const value = useDerivedValue(() =>
		isHorizontal
			? calcValue(translateX.value, offset, itemWidth, itemDistanceMultipier)
			: calcValue(translateY.value, offset, itemHeight, itemDistanceMultipier),
	);

	const animatedStyleWheelTranslation = useAnimatedStyle(() => {
		return {
			transform: [
				isHorizontal
					? {
							translateX: value.value * itemWidth * wheelHeightMultiplier,
					  }
					: {
							translateY: value.value * itemHeight * wheelHeightMultiplier,
					  },
			],
			opacity: 1 - Math.abs(value.value),
			height: itemWidth,
		};
	});

	const animatedStyleScaling = useAnimatedStyle(() => {
		return {
			transform: [
				isHorizontal
					? {
							scaleX: 1 - Math.abs(value.value),
					  }
					: {
							scaleY: 1 - Math.abs(value.value),
					  },
			],
		};
	});

	return (
		<Animated.View
			onLayout={(event) => {
				if (event.nativeEvent.layout.width > width) {
					setWidth(event.nativeEvent.layout.width);
				}
			}}
			style={[
				isHorizontal === true ? styles.item_horizontal : styles.item,
				animatedStyleWheelTranslation,
			]}
		>
			<Animated.View style={[styles.itemInner, animatedStyleScaling]}>
				{renderItem ? (
					renderItem(item)
				) : (
					<Text style={[styles.itemText, textStyle]}>{`${item}`}</Text>
				)}
			</Animated.View>
		</Animated.View>
	);
};

PickerItem.defaultProps = {
	renderItem: undefined,
	textStyle: undefined,
};

const styles = StyleSheet.create({
	item: {
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
		top: 0,
		width: "100%",
	},
	item_horizontal: {
		position: "absolute",
	},
	itemInner: {
		width: "100%",
	},
	itemText: {
		color: "white",
		paddingHorizontal: 16,
		textAlign: "center",
	},
});

export default PickerItem;
