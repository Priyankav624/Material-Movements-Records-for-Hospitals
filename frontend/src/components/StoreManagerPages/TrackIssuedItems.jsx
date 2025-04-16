import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Select, DatePicker, Button, Input } from 'antd';
import { showError } from '../Notification';
// import './TrackIssuedItems.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const TrackIssuedItems = () => {
  const [issuedItems, setIssuedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    materialId: '',
    department: '',
    assignedTo: '',
    dateRange: []
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [departments, setDepartments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetchInitialData();
    fetchIssuedItems();
  }, [pagination.current, filters]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [deptRes, matRes, staffRes] = await Promise.all([
        axios.get('http://localhost:5000/api/material-requests', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        }),
        axios.get('http://localhost:5000/api/materials', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 }
        }),
        axios.get('http://localhost:5000/api/auth', {
          headers: { Authorization: `Bearer ${token}` },
          params: { role: ['Doctor', 'Staff'] }
        })
      ]);

      // Extract unique departments
      const depts = [...new Set(deptRes.data.requests.map(r => r.department))];
      setDepartments(depts);

      setMaterials(matRes.data.materials);
      setStaff(staffRes.data.users);
    } catch (error) {
      showError('Failed to load initial data');
    }
  };

  const fetchIssuedItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };

      if (filters.dateRange?.length === 2) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const response = await axios.get('http://localhost:5000/api/material-requests/track-issued', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setIssuedItems(response.data.issuedItems);
      setPagination({
        ...pagination,
        total: response.data.total
      });
    } catch (error) {
      showError('Failed to fetch issued items');
    } finally {
      setLoading(false);
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

  const columns = [
    {
      title: 'Material',
      dataIndex: ['materialId', 'name'],
      key: 'material'
    },
    {
      title: 'Category',
      dataIndex: ['materialId', 'category'],
      key: 'category'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'Department',
      dataIndex: 'to',
      key: 'department'
    },
    {
      title: 'Assigned To',
      dataIndex: ['assignedTo', 'name'],
      key: 'assignedTo'
    },
    {
      title: 'Issued By',
      dataIndex: ['performedBy', 'name'],
      key: 'performedBy'
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'date',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose'
    }
  ];

  return (
    <div className="track-issued-container">
      <h2>Track Issued Items</h2>
      
      <div className="filters">
        <Select
          placeholder="Filter by Material"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value) => handleFilterChange('materialId', value)}
          allowClear
        >
          {materials.
          filter(m => m && m._id)
          .map(material => (
            <Option key={material._id} value={material._id}>
              {material.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Filter by Department"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value) => handleFilterChange('department', value)}
          allowClear
        >
          {departments
          .filter(dept => dept).map(dept => (
            <Option key={dept} value={dept}>
              {dept}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Filter by Staff"
          style={{ width: 200, marginRight: 10 }}
          onChange={(value) => handleFilterChange('assignedTo', value)}
          allowClear
        >
          {staff.filter(user => user && user._id)
          .map(user => (
            <Option key={user._id} value={user._id}>
              {user.name} ({user.role})
            </Option>
          ))}
        </Select>

        <RangePicker
          style={{ marginRight: 10 }}
          onChange={(dates) => handleFilterChange('dateRange', dates)}
        />

        <Button 
          type="primary" 
          onClick={fetchIssuedItems}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={issuedItems}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default TrackIssuedItems;