from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count
from .models import User, Tenant
from .serializers import (
    UserListSerializer, UserDetailSerializer,
    UserCreateSerializer, UserUpdateSerializer,
    TenantSerializer, CustomTokenObtainPairSerializer,
)
from .permissions import IsSuperAdmin, IsTenantAdminOrAbove


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.annotate(user_count=Count("users"))
    serializer_class = TenantSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "slug", "domain"]
    ordering_fields = ["name", "created_at"]

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        tenant = self.get_object()
        tenant.is_active = False
        tenant.save()
        tenant.users.update(status=User.Status.SUSPENDED)
        return Response({"detail": "Tenant suspended."})

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        tenant = self.get_object()
        tenant.is_active = True
        tenant.save()
        return Response({"detail": "Tenant activated."})


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenantAdminOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["role", "status", "tenant"]
    search_fields = ["email", "first_name", "last_name", "tenant__name"]
    ordering_fields = ["date_joined", "email", "first_name"]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("tenant")
        if user.role == User.Role.SUPER_ADMIN:
            return qs
        return qs.filter(tenant=user.tenant)

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        if self.action == "retrieve":
            return UserDetailSerializer
        return UserListSerializer

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.status = User.Status.SUSPENDED
        user.save()
        return Response({"detail": "User suspended."})

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.status = User.Status.ACTIVE
        user.save()
        return Response({"detail": "User activated."})

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        return Response({
            "total": qs.count(),
            "active": qs.filter(status=User.Status.ACTIVE).count(),
            "suspended": qs.filter(status=User.Status.SUSPENDED).count(),
            "by_role": dict(qs.values_list("role").annotate(count=Count("id"))),
        })
