import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, NavBar, ProgressBar, Selector, Space, Toast } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
];

export function OnboardingPage() {
  const nav = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(avatars[0]);
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<string>('male');
  const [tags, setTags] = useState<string[]>([]);

  const total = 5;
  const pct = ((step + 1) / total) * 100;

  const finish = async () => {
    const { data } = await api.post<ApiResp<any>>('/me/onboarding', {
      avatar,
      nickname,
      gender,
      interestTags: tags,
    });
    if (!data.success) throw new Error(data.message);
    await refreshProfile();
    void Toast.show({ icon: 'success', content: '欢迎来到桌搭社区' });
    nav('/home', { replace: true });
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => nav(-1)}>完善资料</NavBar>
      <ProgressBar percent={pct} text />
      <div className={styles.spacer16} />
      {step === 0 && (
        <div>
          <div className={styles.avatarLabel}>选择一个头像</div>
          <Space wrap>
            {avatars.map(a => (
              <img
                key={a}
                src={a}
                width={72}
                height={72}
                className={`${styles.avatar} ${avatar === a ? styles.avatarActive : ''}`}
                onClick={() => setAvatar(a)}
                alt=""
              />
            ))}
          </Space>
        </div>
      )}
      {step === 1 && (
        <Form layout="vertical">
          <Form.Item label="昵称（2-12字符）">
            <Input value={nickname} onChange={setNickname} placeholder="起个名字" />
          </Form.Item>
        </Form>
      )}
      {step === 2 && (
        <Selector
          columns={3}
          options={[
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
            { label: '保密', value: 'secret' },
          ]}
          value={[gender]}
          onChange={arr => setGender(String(arr[0]))}
        />
      )}
      {step === 3 && (
        <Selector
          multiple
          columns={2}
          options={[
            { label: '桌面美学', value: '桌面美学' },
            { label: '数码外设', value: '数码外设' },
            { label: '电竞装备', value: '电竞装备' },
            { label: '极简风格', value: '极简风格' },
          ]}
          value={tags}
          onChange={arr => setTags(arr as string[])}
        />
      )}
      {step === 4 && <div className={styles.welcome}>欢迎来到桌搭社区，开启你的桌搭之旅</div>}
      <div className={styles.spacer24} />
      <Space direction="vertical" block>
        {step < 4 ? (
          <Button
            color="primary"
            block
            onClick={() => {
              if (step === 1 && (nickname.length < 2 || nickname.length > 12)) {
                void Toast.show({ content: '昵称需2-12字符' });
                return;
              }
              setStep(s => s + 1);
            }}
          >
            下一步
          </Button>
        ) : (
          <Button color="primary" block onClick={() => void finish().catch(e => Toast.show({ content: e.message }))}>
            开始探索
          </Button>
        )}
        {step === 3 && (
          <Button fill="outline" block onClick={() => setStep(4)}>
            跳过兴趣
          </Button>
        )}
      </Space>
    </div>
  );
}
