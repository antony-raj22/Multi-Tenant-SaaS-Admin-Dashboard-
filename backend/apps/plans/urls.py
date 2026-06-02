from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", PlanViewSet, basename="plan")

urlpatterns = [path("", include(router.urls))]
