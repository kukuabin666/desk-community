/**
 * Vite 入口：挂载根组件。全局仅需初始化一次的内容放这里（QueryClient、antd-mobile 语言、样式）。
 * 业务路由与懒加载见 App.tsx；AI/人类上手说明见 ../AI_ONBOARDING.md。
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import 'antd-mobile/es/global';
import './index.css';
import { App } from './App';

// refetchOnWindowFocus: false 减少切回标签页时的自动重请求（与 TanStack 默认策略一致可调）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
