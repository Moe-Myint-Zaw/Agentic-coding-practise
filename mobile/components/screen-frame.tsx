import type { ReactNode } from 'react';
import { KeyboardAvoidingView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

interface ScreenFrameProps {
	children: ReactNode;
	edges?: Edge[];
	keyboardAware?: boolean;
	keyboardVerticalOffset?: number;
	style?: StyleProp<ViewStyle>;
}

export function ScreenFrame({ children, edges = ['top', 'right', 'bottom', 'left'], keyboardAware = false, keyboardVerticalOffset = 0, style }: ScreenFrameProps) {
	return (
		<SafeAreaView edges={edges} style={styles.safeArea}>
			<KeyboardAvoidingView
				behavior={keyboardAware ? 'padding' : undefined}
				keyboardVerticalOffset={keyboardVerticalOffset}
				style={[styles.content, style]}
			>
				{children}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1 },
	content: { flex: 1 },
});