import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { 
  Table, Button, Select, DatePicker, Space, Card, Statistic,
  Modal, Form, Input, InputNumber, message, Spin, Alert
} from 'antd';
import { 
  SearchOutlined, FilePdfOutlined, FilterOutlined, 
  CloseOutlined, PlusOutlined, DeleteOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const MovementLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    action: '',
    dateRange: [],
    department: '',
    material: ''
  });
  const [stats, setStats] = useState({
    totalIssued: 0,
    totalReturned: 0,
    totalDisposed: 0
  });
  const [disposeModalVisible, setDisposeModalVisible] = useState(false);
  const [disposeForm] = Form.useForm();
  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [returnForm] = Form.useForm();

  useEffect(() => {
    fetchMovementLogs();
    fetchStats();
    fetchMaterials();
  }, [filters, pagination.current]);

  // const fetchDepartments = async () => {
  //   setDeptLoading(true);
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await axios.get('http://localhost:5000/api/departments', {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     setDepartments(response.data);
  //   } catch (error) {
  //     console.error('Error fetching departments:', error);
  //     message.error('Failed to fetch departments');
  //   } finally {
  //     setDeptLoading(false);
  //   }
  // };

  const handleReturn = (log) => {
    Modal.confirm({
      title: 'Return Material',
      icon: <CloseOutlined />,
      content: (
        <Form form={returnForm} layout="vertical">
          <Form.Item 
            name="condition" 
            label="Condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Select placeholder="Select condition">
              <Option value="Good">Good</Option>
              <Option value="Damaged">Damaged</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea placeholder="Any additional notes about the return" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await returnForm.validateFields();
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/movement-logs/return', {
            movementId: log._id,
            condition: values.condition,
            notes: values.notes
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          message.success('Material returned successfully');
          returnForm.resetFields();
          fetchMovementLogs();
          fetchStats();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to return material');
          throw error; // Prevent modal from closing on error
        }
      }
    });
  };

  const fetchMovementLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        action: filters.action,
        department: filters.department,
        materialId: filters.material
      };
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = dayjs(filters.dateRange[0]).startOf('day').toISOString();
        params.endDate = dayjs(filters.dateRange[1]).endOf('day').toISOString();
      }

      const response = await axios.get('http://localhost:5000/api/movement-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setLogs(response.data.logs);
      setPagination({
        ...pagination,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching movement logs:', error);
      message.error(error.response?.data?.message || 'Failed to fetch movement logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/movement-logs/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Failed to fetch statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchMaterials = async (searchQuery = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/materials', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchQuery }
      });
      setMaterials(response.data.materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      message.error('Failed to fetch materials');
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      dateRange: [],
      department: '',
      material: ''
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      
      if (filters.dateRange?.length === 2) {
        params.startDate = dayjs(filters.dateRange[0]).format('YYYY-MM-DD');
        params.endDate = dayjs(filters.dateRange[1]).format('YYYY-MM-DD');
      }
      if (filters.action) params.action = filters.action;
      if (filters.department) params.department = filters.department;
      if (filters.material) params.materialId = filters.material;

      const response = await axios.get('http://localhost:5000/api/movement-logs/report', {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, `movement-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      message.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      if (error.response?.status === 404) {
        message.error('No data available for the selected filters');
      } else {
        message.error('Failed to generate report');
      }
    }
  };

  const handleDispose = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/movement-logs/dispose', values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Material disposal recorded successfully');
      setDisposeModalVisible(false);
      disposeForm.resetFields();
      fetchMovementLogs();
      fetchStats();
    } catch (error) {
      console.error('Error disposing material:', error);
      message.error(error.response?.data?.message || 'Failed to record disposal');
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.action === 'Issued' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleReturn(record)}
            >
              Return
            </Button>
          )}
        </Space>
      )
    },
    {
      title: 'Material',
      dataIndex: ['materialId', 'name'],
      key: 'material',
      render: (text, record) => (
        <div>
          <div>{text || 'N/A'}</div>
          {record.batchNumber && (
            <small style={{ color: '#888' }}>Batch: {record.batchNumber}</small>
          )}
        </div>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search material"
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              fetchMaterials(e.target.value);
            }}
            onPressEnter={confirm}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={confirm}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
        </div>
      ),
      onFilter: (value, record) => 
        record.materialId?.name?.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      filters: [
        { text: 'Issued', value: 'Issued' },
        { text: 'Returned', value: 'Returned' },
        { text: 'Disposed', value: 'Disposed' },
        { text: 'Transferred', value: 'Transferred' }
      ],
      onFilter: (value, record) => record.action === value,
      render: (action) => {
        let color = '';
        switch (action) {
          case 'Issued': color = 'blue'; break;
          case 'Returned': color = 'green'; break;
          case 'Disposed': color = 'red'; break;
          default: color = 'orange';
        }
        return <span style={{ color }}>{action}</span>;
      }
    },
    {
      title: 'From → To',
      key: 'fromTo',
      render: (_, record) => (
        <div>
          <div>{record.from || 'N/A'}</div>
          <div>→ {record.to || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: 'Performed By',
      dataIndex: ['performedBy', 'name'],
      key: 'performedBy',
      render: (text) => text || 'System'
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true
    }
  ];

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-md-4">
          <Card>
            <Statistic 
              title="Total Issued" 
              value={stats.totalIssued} 
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={statsLoading}
            />
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <Statistic 
              title="Total Returned" 
              value={stats.totalReturned} 
              prefix={<CloseOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={statsLoading}
            />
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <Statistic 
              title="Total Disposed" 
              value={stats.totalDisposed} 
              prefix={<DeleteOutlined />}
              valueStyle={{ color: '#f5222d' }}
              loading={statsLoading}
            />
          </Card>
        </div>
      </div>

      <Card 
        title="Material Movement Logs"
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />} 
              onClick={generateReport}
              loading={loading}
            >
              Generate Report
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setDisposeModalVisible(true)}
            >
              Record Disposal
            </Button>
          </Space>
        }
      >
        <div className="mb-3">
          <Space size="middle">
            <Select
              placeholder="Filter by Action"
              style={{ width: 180 }}
              allowClear
              value={filters.action || undefined}
              onChange={(value) => handleFilterChange('action', value)}
            >
              <Option value="Issued">Issued</Option>
              <Option value="Returned">Returned</Option>
              <Option value="Disposed">Disposed</Option>
              <Option value="Transferred">Transferred</Option>
            </Select>

            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />

            <Select
              placeholder="Search Material"
              style={{ width: 200 }}
              allowClear
              showSearch
              filterOption={false}
              onSearch={fetchMaterials}
              onChange={(value) => handleFilterChange('material', value)}
              value={filters.material || undefined}
            >
              {materials.map(mat => (
                <Option key={mat._id} value={mat._id}>
                  {mat.name} ({mat.serialNumber})
                </Option>
              ))}
            </Select>

         

            <Button 
              icon={<FilterOutlined />} 
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: true }}
          locale={{
            emptyText: (
              <Alert
                message="No Movement Logs Found"
                description="No movement logs match your current filters."
                type="info"
                showIcon
              />
            )
          }}
        />
      </Card>

      <Modal
        title="Record Material Disposal"
        open={disposeModalVisible}
        onCancel={() => setDisposeModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={disposeForm}
          layout="vertical"
          onFinish={handleDispose}
        >
          <Form.Item
            name="materialId"
            label="Material"
            rules={[{ required: true, message: 'Please select a material' }]}
          >
            <Select
              showSearch
              placeholder="Select material"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              loading={loading}
            >
              {materials.map(mat => (
                <Option key={mat._id} value={mat._id}>
                  {mat.name} ({mat.quantity} available)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Disposal"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="disposalMethod"
            label="Disposal Method"
            rules={[{ required: true, message: 'Please select disposal method' }]}
          >
            <Select>
              <Option value="Incineration">Incineration</Option>
              <Option value="Landfill">Landfill</Option>
              <Option value="Recycling">Recycling</Option>
              <Option value="ReturnToVendor">Return to Vendor</Option>
              <Option value="BiohazardDisposal">Biohazard Disposal</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Record Disposal
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MovementLogs;