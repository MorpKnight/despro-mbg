import React, { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface GridProps extends ViewProps {
    /** Number of columns on mobile (default: 1) */
    mobileColumns?: 1 | 2;
    /** Number of columns on tablet (default: 2) */
    tabletColumns?: 2 | 3;
    /** Number of columns on desktop (default: 3) */
    desktopColumns?: 2 | 3 | 4;
    /** Gap between grid items (default: 4 = 16px) */
    gap?: number;
}

/**
 * Responsive grid component that automatically adjusts columns based on screen size
 */
export default function Grid({
    children,
    mobileColumns = 1,
    tabletColumns = 2,
    desktopColumns = 3,
    gap = 4,
    className = '',
    ...rest
}: PropsWithChildren<GridProps>) {
    const { isDesktop, isTablet } = useResponsive();

    let columns: number = mobileColumns;
    if (isTablet) columns = tabletColumns;
    if (isDesktop) columns = desktopColumns;

    const gapClass = `gap-${gap}`;

    return (
        <View
            className={`flex-row flex-wrap ${gapClass} ${className}`}
            {...rest}
        >
            {React.Children.map(children, (child, index) => (
                <View
                    key={index}
                    style={{ width: `${(100 / columns) - (gap * 0.5)}%` }}
                >
                    {child}
                </View>
            ))}
        </View>
    );
}
