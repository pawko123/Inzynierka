import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const MOBILE_BREAKPOINT = 768; // Width below which we consider it mobile

export function useResponsive() {
	const [dimensions, setDimensions] = useState(Dimensions.get('window'));

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setDimensions(window);
		});

		return () => subscription?.remove();
	}, []);

	const isMobile = dimensions.width < MOBILE_BREAKPOINT;
	const isTablet = dimensions.width >= MOBILE_BREAKPOINT && dimensions.width < 1024;
	const isDesktop = dimensions.width >= 1024;

	return {
		isMobile,
		isTablet,
		isDesktop,
		width: dimensions.width,
		height: dimensions.height,
	};
}
