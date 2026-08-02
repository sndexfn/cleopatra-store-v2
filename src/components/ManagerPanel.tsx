import React from 'react';

type User = {
  email?: string;
  role?: string;
};

export default function ManagerPanel({ user }: { user?: User }) {
  if (!user || user.role !== 'manager') return null;

  return (
    <div className="manager-panel" style={{ border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
      <h3>Manager Controls</h3>
      <p>مرحباً بك أيها المدير — هذه الأدوات متاحة فقط لك.</p>
      <ul>
        <li><a href="/admin/users">إدارة المستخدمين</a></li>
        <li><a href="/admin/settings">إعدادات المتجر</a></li>
        <li><a href="/admin/orders">عرض وإدارة الطلبات</a></li>
      </ul>
    </div>
  );
}
