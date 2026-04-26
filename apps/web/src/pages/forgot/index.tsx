import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Button, Form, Input, Toast, NavBar } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import styles from './index.module.less';

export function ForgotPage() {
  const nav = useNavigate();
  const [phoneDraft, setPhoneDraft] = useState('');
  const send = async (phone: string) => {
    const { data } = await api.post<ApiResp<{ mockCode?: string }>>('/auth/sms/send', { phone });
    if (!data.success) throw new Error(data.message);
    if (data.data?.mockCode) Toast.show({ content: `验证码：${data.data.mockCode}`, duration: 5000 });
  };
  return (
    <div>
      <NavBar onBack={() => nav(-1)}>忘记密码</NavBar>
      <Form
        onValuesChange={useCallback((_: any, all: any) => setPhoneDraft(String(all.phone || '')), [])}
        onFinish={v => {
          void (async () => {
            try {
              const { data } = await api.post<ApiResp<any>>('/auth/forgot', v);
              if (!data.success) throw new Error(data.message);
              void Toast.show({ icon: 'success', content: '密码已重置' });
              nav('/login', { replace: true });
            } catch (e: any) {
              void Toast.show({ content: e.message });
            }
          })();
        }}
        footer={
          <Button block color="primary" type="submit">
            重置密码
          </Button>
        }
      >
        <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="验证码">
          <div className={styles.flexRow8}>
            <Form.Item name="code" noStyle rules={[{ required: true }]}>
              <Input />
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
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true }]}>
          <Input type="password" />
        </Form.Item>
      </Form>
    </div>
  );
}
