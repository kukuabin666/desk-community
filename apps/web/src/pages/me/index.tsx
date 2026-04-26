import { useNavigate } from 'react-router-dom';
import { Avatar, List, NavBar, Tag, Toast } from 'antd-mobile';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function MePage() {
  const nav = useNavigate();
  const { user, token, logout } = useAuth();
  return (
    <div>
      <NavBar>我的</NavBar>
      {token ? (
        <div className={styles.userRow}>
          <Avatar src={user?.avatar || ''} className={styles.avatarLarge} />
          <div className={styles.userMain}>
            <div className={styles.nickname}>{user?.nickname}</div>
            <div className={styles.tagRow}>
              <Tag color="primary">Lv.{user?.level ?? 1}</Tag>
              <Tag>积分 {user?.pointsBalance ?? 0}</Tag>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.guestPad}>
          <List>
            <List.Item onClick={() => nav('/login')}>登录 / 注册</List.Item>
          </List>
        </div>
      )}
      <List>
        <List.Item
          onClick={() => (user?.id ? nav(`/user/${user.id}`) : Toast.show({ content: '请先登录' }))}
        >
          个人主页
        </List.Item>
        <List.Item onClick={() => nav('/points')}>我的积分</List.Item>
        <List.Item onClick={() => nav('/series-manage')}>编辑系列</List.Item>
        <List.Item onClick={() => nav('/settings')}>设置</List.Item>
        {token ? <List.Item onClick={logout}>退出登录</List.Item> : null}
      </List>
    </div>
  );
}
