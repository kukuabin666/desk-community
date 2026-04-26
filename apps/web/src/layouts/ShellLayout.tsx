/**
 * 带底部 Tab 的「壳」布局：子路由见 `routes/routeConfig.ts` 中 `layout: 'shell'`。
 *
 * 坑：`SHELL_TABS[].key` 的顺序必须与 `SHELL_TAB_PATHS`（由 shell 页在 `APP_ROUTES` 中的顺序导出）一致；
 * `activeKey` 用 `SHELL_TAB_PATHS` 做前缀匹配，Tab 项顺序若与路径列表错位，会出现高亮与点击项不符。
 * 图标放在模块顶层，避免每次 render 新引用导致 TabBar 无意义子树更新。
 */
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ActionSheet, TabBar } from 'antd-mobile';
import { AppOutline, MessageOutline, UserOutline, UnorderedListOutline } from 'antd-mobile-icons';
import { SHELL_TAB_PATHS } from '../routes/routeConfig';
import styles from './ShellLayout.module.less';

/** 模块级稳定 React 元素：TabBar.Item 的 icon 引用不在每帧变化 */
const ICON_HOME = <AppOutline />;
const ICON_SHOP = <UnorderedListOutline />;
const ICON_PUBLISH = <span className={styles.publishIcon}>＋</span>;
const ICON_MESSAGES = <MessageOutline />;
const ICON_ME = <UserOutline />;

/** key 顺序须与 `routeConfig` 导出的 `SHELL_TAB_PATHS` 一致（见文件头注释） */
const SHELL_TABS = [
  { key: '/home', title: '首页', icon: ICON_HOME },
  { key: '/shop', title: '小店', icon: ICON_SHOP },
  { key: '/publish', title: '发布', icon: ICON_PUBLISH },
  { key: '/messages', title: '消息', icon: ICON_MESSAGES },
  { key: '/me', title: '我的', icon: ICON_ME },
] as const;

export function ShellLayout() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  // 前缀匹配：子路径归到对应 Tab（如 /publish/xxx → 发布）
  const activeKey =
    SHELL_TAB_PATHS.find(key => pathname === key || pathname.startsWith(`${key}/`)) ?? '/home';

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <Outlet />
      </div>
      <TabBar
        safeArea
        activeKey={activeKey}
        onChange={key => {
          // 已在首页再点「首页」：通知 HomePage 刷新列表（见 HomePage 中同名事件监听）
          if (key === '/home' && pathname === '/home') {
            window.dispatchEvent(new CustomEvent('desk:home-refresh'));
          }
          if (key === '/publish') {
            ActionSheet.show({
              actions: [
                { text: '发布分享', key: 'share' },
                { text: '求改造', key: 'renovation' },
              ],
              onAction: a => {
                if (a.key === 'renovation') nav('/publish?type=renovation');
                else nav('/publish?type=share');
              },
            });
            return;
          }
          nav(key);
        }}
      >
        {SHELL_TABS.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  );
}
