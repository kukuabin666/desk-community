import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Tabs, Toast, NavBar } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function RegisterPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState<'phone' | 'user'>('phone');
  const [phoneDraft, setPhoneDraft] = useState('');

  const send = async (phone: string) => {
    const { data } = await api.post<ApiResp<{ mockCode?: string }>>('/auth/sms/send', { phone });
    if (!data.success) throw new Error(data.message);
    if (data.data?.mockCode)
      void Toast.show({ content: `验证码：${data.data.mockCode}`, duration: 5000 });
    else void Toast.show({ content: '验证码已发送' });
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>注册</NavBar>
      <Tabs activeKey={tab} onChange={k => setTab(k as 'phone' | 'user')}>
        <Tabs.Tab title="手机号注册" key="phone">
          <Form
            onValuesChange={(_: any, all: any) => setPhoneDraft(String(all.phone || ''))}
            onFinish={v => {
              void (async () => {
                try {
                  const { data } = await api.post<ApiResp<any>>('/auth/register/phone', v);
                  if (!data.success) throw new Error(data.message);
                  await login(data.data.accessToken, data.data.refreshToken);
                  void Toast.show({ icon: 'success', content: '注册成功' });
                  nav('/onboarding', { replace: true });
                } catch (e: any) {
                  void Toast.show({ content: e.message });
                }
              })();
            }}
            footer={
              <Button block color="primary" type="submit" size="large">
                完成注册
              </Button>
            }
          >
            <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="验证码">
              <div className={styles.flexRow8}>
                <Form.Item name="code" noStyle rules={[{ required: true }]}>
                  <Input placeholder="6位验证码" />
                </Form.Item>
                <Button
                  size="small"
                  onClick={() => {
                    if (!phoneDraft) return;
                    void send(phoneDraft).catch(e => Toast.show({ content: e.message }));
                  }}
                >
                  获取验证码
                </Button>
              </div>
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input type="password" />
            </Form.Item>
          </Form>
        </Tabs.Tab>
        <Tabs.Tab title="平台账号" key="user">
          <Form
            onFinish={v => {
              void (async () => {
                try {
                  const { data } = await api.post<ApiResp<any>>('/auth/register/username', v);
                  if (!data.success) throw new Error(data.message || '注册失败');
                  await login(data.data.accessToken, data.data.refreshToken);
                  void Toast.show({ icon: 'success', content: '注册成功，请绑定手机号' });
                  nav('/onboarding', { replace: true });
                } catch (e: any) {
                  void Toast.show({ content: e.message });
                }
              })();
            }}
            footer={
              <Button block color="primary" type="submit" size="large">
                注册
              </Button>
            }
          >
            <Form.Item name="username" label="账号" rules={[{ required: true }]}>
              <Input placeholder="6-20位字母或数字" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input type="password" />
            </Form.Item>
          </Form>
        </Tabs.Tab>
      </Tabs>
      <div className={styles.footerLink}>
        <Link to="/login">已有账号？去登录</Link>
      </div>
    </div>
  );
}
