import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#2A9D8F',
    colorSuccess: '#95A5A6',
    colorWarning: '#E9C46A',
    colorError: '#E76F51',
    colorInfo: '#264653',
    borderRadius: 4,
    wireframe: true,
    fontSize: 14,
  },
  components: {
    Table: {
      headerBg: '#F5F5F5',
      headerColor: '#264653',
      rowHoverBg: '#E9F2F1',
      borderColor: '#DDD',
    },
    Button: {
      primaryColor: '#FFFFFF',
      defaultBg: '#F5F5F5',
      defaultColor: '#264653',
    },
    Modal: {
      headerBg: '#F5F5F5',
      titleColor: '#264653',
    },
    Form: {
      labelColor: '#264653',
    },
  },
};
