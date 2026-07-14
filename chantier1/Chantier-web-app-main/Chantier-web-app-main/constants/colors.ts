export const Colors = {
  primary: '#FF6B35',
  primaryLight: '#FF8A50',
  primaryDark: '#E55A2B',
  
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  
  success: '#66BB6A',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',
  
  background: '#F5F5F5',
  surface: '#FFFFFF',
  
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#FFFFFF',
  },

  /** Text on warm peach/orange card backgrounds (e.g. bgcard-chantier) */
  cardWarm: {
    title: '#1A120E',
    body: '#4A382F',
    meta: '#2E2218',
    muted: '#6B5348',
    label: '#B84512',
  },
  
  border: {
    light: '#E5E5E5',
    medium: '#E0E0E0',
    dark: '#CCC',
  },
  
  gradient: {
    orange: ['#FF8A50', '#FF6B35', '#E55A2B'],
    green: ['#34D399', '#10B981', '#059669'],
  },
} as const;