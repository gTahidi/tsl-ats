'use client';

import { AuthUser, PermissionCheck } from '@/types';
import { useUser } from '../contexts/UserContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionCheck;
  permissions?: PermissionCheck[];
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // For multiple permissions, require all (default) or any
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  role,
  roles,
  fallback = null,
  requireAll = true,
}: PermissionGuardProps) {
  const { user, loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return fallback;
  }

  // Check single permission
  if (permission) {
    const permissionName = `${permission.resource}:${permission.action}`;
    if (!user.permissions.includes(permissionName)) {
      return fallback;
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const permissionNames = permissions.map(p => `${p.resource}:${p.action}`);
    const hasPermissions = requireAll
      ? permissionNames.every(p => user.permissions.includes(p))
      : permissionNames.some(p => user.permissions.includes(p));
    
    if (!hasPermissions) {
      return fallback;
    }
  }

  // Check single role
  if (role && !user.roles.includes(role)) {
    return fallback;
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    const hasRoles = requireAll
      ? roles.every(r => user.roles.includes(r))
      : roles.some(r => user.roles.includes(r));
    
    if (!hasRoles) {
      return fallback;
    }
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user, loading } = useUser();

  const hasPermission = (permission: PermissionCheck): boolean => {
    if (!user) return false;
    const permissionName = `${permission.resource}:${permission.action}`;
    return user.permissions.includes(permissionName);
  };

  const hasAnyPermission = (permissions: PermissionCheck[]): boolean => {
    if (!user) return false;
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: PermissionCheck[]): boolean => {
    if (!user) return false;
    return permissions.every(p => hasPermission(p));
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.includes(roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user) return false;
    return roleNames.some(r => user.roles.includes(r));
  };

  return {
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };
}