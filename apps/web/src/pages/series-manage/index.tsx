import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, List, NavBar, Toast } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function SeriesManagePage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');

  const load = () => {
    if (!user) return;
    api.get<ApiResp<any[]>>(`/users/${user.id}/series`).then(r => r.data.success && setRows(r.data.data || []));
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const create = async () => {
    if (name.trim().length < 2) return void Toast.show({ content: '名称至少2个字符' });
    const { data } = await api.post<ApiResp<any>>('/me/series', { name: name.trim() });
    if (!data.success) throw new Error(data.message);
    setName('');
    void Toast.show({ content: '创建成功' });
    load();
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>编辑系列</NavBar>
      <div className={styles.toolbar}>
        <Input placeholder="新系列名称" value={name} onChange={setName} />
        <Button color="primary" onClick={() => void create().catch(e => Toast.show({ content: e.message }))}>
          新建
        </Button>
      </div>
      <List>
        {rows.map(s => (
          <List.Item
            key={s.id}
            onClick={() => nav(`/series/${s.id}`)}
            extra={
              <Button
                size="mini"
                color="danger"
                onClick={e => {
                  e.stopPropagation();
                  void api.post(`/me/series/${s.id}/remove`).then(() => {
                    void Toast.show({ content: '已删除' });
                    load();
                  });
                }}
              >
                删除
              </Button>
            }
          >
            {s.name}
          </List.Item>
        ))}
      </List>
    </div>
  );
}
