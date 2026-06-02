from rest_framework.permissions import BasePermission
from .models import User


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Role.SUPER_ADMIN
        )


class IsTenantAdminOrAbove(BasePermission):
    ALLOWED_ROLES = {User.Role.SUPER_ADMIN, User.Role.TENANT_ADMIN}

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in self.ALLOWED_ROLES
        )
