import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, ErrorBlock, List, NavBar, Tabs, Toast } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';

export function FollowListPage() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const uid = Number(id);
  const initial = (sp.get('tab') as 'following' | 'followers') || 'following';
  const [tab, setTab] = useState(initial);
  const [data, setData] = useState<{ private?: boolean; users: any[] }>({ users: [] });

  const title = useMemo(() => (tab === 'followers' ? '粉丝' : '关注'), [tab]);

  useEffect(() => {
    const path = tab === 'followers' ? 'followers' : 'following';
    api
      .get<ApiResp<any>>(`/users/${uid}/${path}`)
      .then(r => {
        if (!r.data.success) throw new Error(r.data.message);
        setData(r.data.data);
      })
      .catch(e => Toast.show(e.message));
  }, [uid, tab]);

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>{title}</NavBar>
      <Tabs activeKey={tab} onChange={k => setTab(k as any)}>
        <Tabs.Tab title="关注" key="following" />
        <Tabs.Tab title="粉丝" key="followers" />
      </Tabs>
      {data.private ? (
        <ErrorBlock status="default" title="对方已设置隐私保护" />
      ) : (
        <List>
          {data.users.map(u => (
            <List.Item
              key={u.id}
              prefix={<Avatar src={u.avatar} />}
              description={u.bio}
              onClick={() => nav(`/user/${u.id}`)}
            >
              {u.nickname} · Lv.{u.level}
            </List.Item>
          ))}
        </List>
      )}
    </div>
  );
}
