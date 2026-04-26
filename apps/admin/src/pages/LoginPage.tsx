import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography } from 'antd';
import { App } from 'antd';
import { api, setAuthHeader, type ApiResp } from '../api/client';
import { REFRESH_KEY, TOKEN_KEY } from '../auth/storage';

type LoginResp = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  role?: string;
  needDeviceVerify?: boolean;
};

export function LoginPage() {
  const nav = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (v: { account: string; password: string }) => {
    try {
      const { data } = await api.post<ApiResp<LoginResp>>('/auth/login', {
        account: v.account,
        password: v.password,
      });
      if (!data.success) {
        message.error(data.message || '登录失败');
        return;
      }
      const d = data.data;
      if (!d) {
        message.error('响应异常');
        return;
      }
      if (d.needDeviceVerify) {
        message.warning('新设备需短信验证，请先在 H5/Web 完成验证后再使用管理端');
        return;
      }
      if (d.role !== 'admin') {
        message.error('当前账号不是管理员。请在环境变量 DESK_ADMIN_USERNAME 指定用户名并重启 API 后，再登录一次。');
        return;
      }
      localStorage.setItem(TOKEN_KEY, d.accessToken);
      localStorage.setItem(REFRESH_KEY, d.refreshToken);
      setAuthHeader(d.accessToken);
      message.success('登录成功');
      nav('/products', { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }} title="桌搭社区 · 管理端登录">
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          与客户端共用 <Typography.Text code>/api/auth/login</Typography.Text>；仅 <Typography.Text code>role=admin</Typography.Text> 可进入后台。
        </Typography.Paragraph>
        <Form layout="vertical" onFinish={v => void onFinish(v)}>
          <Form.Item name="account" label="用户名或手机号" rules={[{ required: true }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
