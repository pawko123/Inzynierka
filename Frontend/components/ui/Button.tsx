import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ButtonProps } from '@/types/ui';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'circular';
export type ButtonSize = 'small' | 'medium' | 'large';

export default function Button({
	title,
	onPress,
	variant = 'primary',
	size = 'medium',
	disabled = false,
	style,
	textStyle,
	activeOpacity = 0.8,
	icon,
	isCircular = false,
}: ButtonProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	const getButtonStyle = (): ViewStyle => {
		const baseStyle = isCircular ? styles[`${size}Circular`] : styles[size];

		switch (variant) {
			case 'primary':
				return {
					...baseStyle,
					backgroundColor: disabled ? colors.tabIconDefault : colors.tint,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: disabled ? 0 : 0.1,
					shadowRadius: 4,
					elevation: disabled ? 0 : 3,
				};
			case 'secondary':
				return {
					...baseStyle,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
				};
			case 'outline':
				return {
					...baseStyle,
					backgroundColor: 'transparent',
					borderWidth: 1,
					borderColor: disabled ? colors.tabIconDefault : colors.tint,
				};
			case 'circular':
				return {
					...baseStyle,
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
				};
			default:
				return baseStyle;
		}
	};

	const getTextStyle = (): TextStyle => {
		const baseTextStyle = styles[`${size}Text` as keyof typeof styles] as TextStyle;

		switch (variant) {
			case 'primary':
				return {
					...baseTextStyle,
					color: disabled ? colors.tabIconDefault : colors.background,
				};
			case 'secondary':
				return {
					...baseTextStyle,
					color: disabled ? colors.tabIconDefault : colors.text,
				};
			case 'outline':
				return {
					...baseTextStyle,
					color: disabled ? colors.tabIconDefault : colors.tint,
				};
			default:
				return baseTextStyle;
		}
	};

	return (
		<TouchableOpacity
			style={[getButtonStyle(), style]}
			onPress={onPress}
			disabled={disabled}
			activeOpacity={disabled ? 1 : activeOpacity}
		>
			{icon ? icon : title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	// Size variants
	small: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	medium: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 10,
		alignItems: 'center',
	},
	large: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},

	// Circular size variants
	smallCircular: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	mediumCircular: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	largeCircular: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Text size variants
	smallText: {
		fontSize: 14,
		fontWeight: '500',
	},
	mediumText: {
		fontSize: 15,
		fontWeight: '500',
	},
	largeText: {
		fontSize: 16,
		fontWeight: '600',
	},
});
