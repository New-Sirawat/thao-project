export const theme = {
  colors: {
    primary: '#FF8C00',      // Brand Orange
    background: '#F3F4F6',   // Light Gray main background
    surface: '#FFFFFF',      // Clean White for cards
    text: '#111827',         // Dark text for high contrast
    textSecondary: '#6B7280',// Gray text
    border: '#E5E7EB',       // Subtle border color
    destructive: '#FFE5E5',  // Light red background
    destructiveText: '#FF3B30', // Red text
    success: '#10B981',      // Green
    warning: '#F59E0B',      // Yellow
    eventToday: '#FF8C00',
    eventTomorrow: '#3B82F6',
    eventFuture: '#10B981',
    quickAccessBg: '#FFF3E0', // Light pastel orange
  },
  typography: {
    fontFamily: 'Inter_400Regular',
    fontFamilyBold: 'Inter_700Bold',
    fontFamilySemiBold: 'Inter_600SemiBold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadows: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    }
  }
};
