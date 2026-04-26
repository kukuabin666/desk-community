import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, List, NavBar } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import styles from './index.module.less';

export function SearchPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const run = async () => {
    const { data } = await api.get<ApiResp<any>>('/search', { params: { q } });
    if (!data.success) return;
    setPosts(data.data?.posts || []);
    setUsers(data.data?.users || []);
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>搜索</NavBar>
      <div className={styles.searchRow}>
        <Input placeholder="帖子 / 用户昵称" value={q} onChange={setQ} />
        <Button color="primary" onClick={() => run().catch(() => {})}>
          搜索
        </Button>
      </div>
      <List header="用户">
        {users.map(u => (
          <List.Item key={u.id} onClick={() => nav(`/user/${u.id}`)}>
            {u.nickname}
          </List.Item>
        ))}
      </List>
      <List header="帖子">
        {posts.map(p => (
          <List.Item key={p.id} onClick={() => nav(`/post/${p.id}`)}>
            {p.title}
          </List.Item>
        ))}
      </List>
    </div>
  );
}
