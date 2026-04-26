import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, NavBar, Switch, Toast } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';

export function SettingsPage() {
  const nav = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [pubF, setPubF] = useState(true);
  const [pubG, setPubG] = useState(true);

  useEffect(() => {
    api.get<ApiResp<any[]>>('/me/devices').then(r => r.data.success && setDevices(r.data.data || []));
    api.get<ApiResp<any[]>>('/me/login-logs').then(r => r.data.success && setLogs(r.data.data || []));
    api.get<ApiResp<any>>('/me').then(r => {
      if (r.data.success && r.data.data) {
        setPubF(!!r.data.data.followersPublic);
        setPubG(!!r.data.data.followingPublic);
      }
    });
  }, []);

  const savePrivacy = async (nextF: boolean, nextG: boolean) => {
    await api.post('/me', { followersPublic: nextF, followingPublic: nextG });
    Toast.show({ content: '已保存' });
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>设置</NavBar>
      <List header="隐私">
        <List.Item
          extra={
            <Switch
              checked={pubG}
              onChange={async v => {
                setPubG(v);
                await savePrivacy(pubF, v);
              }}
            />
          }
          description="关注列表是否对他人可见"
        >
          关注列表公开
        </List.Item>
        <List.Item
          extra={
            <Switch
              checked={pubF}
              onChange={async v => {
                setPubF(v);
                await savePrivacy(v, pubG);
              }}
            />
          }
          description="粉丝列表是否对他人可见"
        >
          粉丝列表公开
        </List.Item>
      </List>
      <List header="设备管理">
        {devices.map(d => (
          <List.Item
            key={d.id}
            description={`最近登录：${new Date(d.lastSeenAt).toLocaleString()}`}
            extra={
              <a
                onClick={() =>
                  void api.post(`/me/devices/${d.id}/remove`).then(() => {
                    Toast.show({ content: '已移除' });
                    setDevices(x => x.filter(y => y.id !== d.id));
                  })
                }
              >
                移除
              </a>
            }
          >
            {d.deviceLabel || d.deviceId}
          </List.Item>
        ))}
      </List>
      <List header="登录日志">
        {logs.map(l => (
          <List.Item key={l.id} description={`${l.ip} ${(l.userAgent || '').slice(0, 48)}`}>
            {new Date(l.createdAt).toLocaleString()}
          </List.Item>
        ))}
      </List>
    </div>
  );
}
