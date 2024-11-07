import type { ThemeConfig } from 'antd';

const themeConfig: ThemeConfig = {
  token: {
    // Color palette
    colorPrimary: '#2A9D8F', // Muted teal
    colorSuccess: '#95A5A6', // Muted green
    colorWarning: '#E9C46A', // Muted yellow
    colorError: '#E76F51',   // Muted red
    colorInfo: '#264653',    // Muted blue

    // Component styles
    borderRadius: 4,
    wireframe: false,

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    fontSize: 14,

    // Layout
    controlHeight: 36,
    paddingContentHorizontal: 16,
    paddingContentVertical: 12,
  },
  components: {
    Card: {
      paddingLG: 24,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    Button: {
      primaryShadow: 'none',
      borderRadius: 4,
      controlHeight: 36,
    },
    Table: {
      headerBg: '#F5F5F5',
      headerColor: '#264653',
      rowHoverBg: '#F8F9FA',
      borderRadius: 8,
    },
    Layout: {
      bodyBg: '#F8F9FA',
      headerBg: '#FFFFFF',
      siderBg: '#FFFFFF',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#E9ECEF',
      itemHoverBg: '#F8F9FA',
    },
  },
};

export default themeConfig;
