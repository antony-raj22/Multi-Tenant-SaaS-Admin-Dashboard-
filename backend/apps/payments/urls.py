from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", PaymentViewSet, basename="payment")

urlpatterns = [path("", include(router.urls))]
