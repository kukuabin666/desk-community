import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  App,
  Button,
  Form,
  Input,
  Layout,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api, setAuthHeader, type ApiResp } from '../api/client';
import { REFRESH_KEY, TOKEN_KEY } from '../auth/storage';

type Product = {
  id: number;
  name: string;
  coverUrl: string;
  priceText: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
};

export function ProductManagePage() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm<{ name: string; coverUrl: string; priceText: string; description: string }>();

  const load = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    setAuthHeader(t);
    setLoading(true);
    try {
      const { data } = await api.get<ApiResp<Product[]>>('/admin/products');
      if (!data.success) throw new Error(data.message);
      setList(data.data || []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAuthHeader(null);
    nav('/login', { replace: true });
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (row: Product) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      coverUrl: row.coverUrl,
      priceText: row.priceText,
      description: row.description,
    });
    setModalOpen(true);
  };

  const submitForm = async () => {
    const v = await form.validateFields();
    try {
      if (editing) {
        const { data } = await api.put<ApiResp<Product>>(`/admin/products/${editing.id}`, v);
        if (!data.success) throw new Error(data.message);
        message.success('已保存');
      } else {
        const { data } = await api.post<ApiResp<Product>>('/admin/products', v);
        if (!data.success) throw new Error(data.message);
        message.success('已创建');
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '提交失败');
    }
  };

  const remove = async (id: number) => {
    try {
      const { data } = await api.post<ApiResp<{ ok: boolean }>>(`/admin/products/${id}/remove`);
      if (!data.success) throw new Error(data.message);
      message.success('已删除');
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '封面', dataIndex: 'coverUrl', ellipsis: true, width: 200 },
    { title: '价格文案', dataIndex: 'priceText', width: 100 },
    {
      title: '操作',
      key: 'act',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => void remove(row.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          桌搭社区 · 商品管理
        </Typography.Title>
        <Space>
          <Button onClick={() => void load()}>刷新</Button>
          <Button type="primary" onClick={openCreate}>
            新建商品
          </Button>
          <Button onClick={logout}>退出</Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={{ pageSize: 20 }} />
      </Layout.Content>
      <Modal
        title={editing ? `编辑 #${editing.id}` : '新建商品'}
        open={modalOpen}
        onOk={() => void submitForm()}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面 URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="priceText" label="价格文案">
            <Input placeholder="¥99" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
