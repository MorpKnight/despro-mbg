import { useWindowDimensions } from 'react-native';

export interface ResponsiveValues {
    width: number;
    height: number;
    isDesktop: boolean;
    isTablet: boolean;
    isMobile: boolean;
    isSmallMobile: boolean;
}

/**
 * Custom hook for responsive design
 * 
 * Breakpoints:
 * - Small Mobile: < 375px
 * - Mobile: < 640px
 * - Tablet: 640px - 767px
 * - Desktop: >= 768px
 */
export function useResponsive(): ResponsiveValues {
    const { width, height } = useWindowDimensions();

    const isDesktop = width >= 768;
    const isTablet = width >= 640 && width < 768;
    const isMobile = width < 640;
    const isSmallMobile = width < 375;

    return {
        width,
        height,
        isDesktop,
        isTablet,
        isMobile,
        isSmallMobile,
    };
}

/**
 * Get responsive value based on screen size
 * @param mobile - Value for mobile screens
 * @param desktop - Value for desktop screens
 * @param tablet - Optional value for tablet screens
 */
export function useResponsiveValue<T>(
    mobile: T,
    desktop: T,
    tablet?: T
): T {
    const { isDesktop, isTablet } = useResponsive();

    if (isDesktop) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
}
