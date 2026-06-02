from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TenantViewSet

router = DefaultRouter(trailing_slash=False)
router.register("tenants", TenantViewSet, basename="tenant")
router.register("", UserViewSet, basename="user")

urlpatterns = [path("", include(router.urls))]
