import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, NavBar, Tabs, Toast } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState<'pwd' | 'sms'>('pwd');
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState('');

  const onPwd = async (v: { account: string; password: string }) => {
    const { data } = await api.post<ApiResp<any>>('/auth/login', v);
    if (!data.success) throw new Error(data.message);
    if (data.data?.needDeviceVerify) {
      void Toast.show({ content: '新设备登录，请完成短信验证（开发中）' });
      return;
    }
    await login(data.data.accessToken, data.data.refreshToken);
    void Toast.show({ content: '登录成功', icon: 'success' });
    nav('/home', { replace: true });
  };

  const sendSms = async () => {
    await api.post('/auth/sms/send', { phone });
    void Toast.show({ content: '验证码已发送（mock 见控制台）' });
  };

  const onSms = async () => {
    const { data } = await api.post<ApiResp<any>>('/auth/login/sms', { phone, code: sms });
    if (!data.success) throw new Error(data.message);
    if (data.data?.needDeviceVerify) {
      void Toast.show({ content: '新设备验证（开发中）' });
      return;
    }
    await login(data.data.accessToken, data.data.refreshToken);
    nav('/home', { replace: true });
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>登录</NavBar>
      <Tabs activeKey={tab} onChange={k => setTab(k as 'pwd' | 'sms')}>
        <Tabs.Tab title="密码登录" key="pwd">
          <Form
            layout="horizontal"
            onFinish={v => {
              void onPwd(v as any).catch(e => Toast.show({ content: e.message }));
            }}
            footer={
              <Button block type="submit" color="primary" size="large">
                登录
              </Button>
            }
          >
            <Form.Item name="account" label="账号/手机" rules={[{ required: true }]}>
              <Input placeholder="用户名或手机号" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input type="password" placeholder="密码" />
            </Form.Item>
          </Form>
        </Tabs.Tab>
        <Tabs.Tab title="验证码登录" key="sms">
          <div className={styles.smsPad}>
            <Input placeholder="手机号" value={phone} onChange={setPhone} />
            <div className={styles.spacer10} />
            <Input placeholder="验证码" value={sms} onChange={setSms} />
            <div className={styles.spacer10} />
            <Button onClick={() => void sendSms().catch(e => Toast.show({ content: e.message }))}>获取验证码</Button>
            <div className={styles.spacer10} />
            <Button color="primary" block onClick={() => void onSms().catch(e => Toast.show({ content: e.message }))}>
              登录
            </Button>
          </div>
        </Tabs.Tab>
      </Tabs>
      <div className={styles.lrLinks}>
        <Link to="/register">注册</Link>
        <Link to="/forgot">忘记密码</Link>
      </div>
    </div>
  );
}
