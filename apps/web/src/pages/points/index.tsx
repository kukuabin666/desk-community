import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, NavBar, Tabs, Tag } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function PointsPage() {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'earn' | 'spend'>('earn');
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    api
      .get<ApiResp<any[]>>(`/me/points/ledger`, { params: { type: tab } })
      .then(r => r.data.success && setRows(r.data.data || []));
  }, [tab]);

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>我的积分</NavBar>
      <div className={styles.balance}>
        <Tag color="primary" className={styles.pointsTag}>
          当前积分 {user?.pointsBalance ?? 0}
        </Tag>
      </div>
      <Tabs activeKey={tab} onChange={k => setTab(k as any)}>
        <Tabs.Tab title="获取记录" key="earn" />
        <Tabs.Tab title="消耗记录" key="spend" />
      </Tabs>
      <List>
        {rows.map(r => (
          <List.Item key={r.id} extra={r.delta > 0 ? `+${r.delta}` : r.delta} description={r.memo}>
            {r.action} · {new Date(r.createdAt).toLocaleString()}
          </List.Item>
        ))}
      </List>
    </div>
  );
}
