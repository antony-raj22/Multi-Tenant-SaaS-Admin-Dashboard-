from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("api/auth/login", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh", TokenRefreshView.as_view(), name="token_refresh"),

    # App APIs
    path("api/users", include("apps.users.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/subscriptions", include("apps.subscriptions.urls")),
    path("api/subscriptions/", include("apps.subscriptions.urls")),
    path("api/plans", include("apps.plans.urls")),
    path("api/plans/", include("apps.plans.urls")),
    path("api/payments", include("apps.payments.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/analytics", include("apps.analytics.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/notifications", include("apps.notifications.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/settings", include("apps.settings.urls")),
    path("api/settings/", include("apps.settings.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
