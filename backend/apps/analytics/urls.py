from django.urls import path
from .views import DashboardSummaryView, RevenueChartView, UserGrowthView, PlanDistributionView

urlpatterns = [
    path("summary", DashboardSummaryView.as_view(), name="analytics-summary"),
    path("revenue", RevenueChartView.as_view(), name="analytics-revenue"),
    path("user-growth", UserGrowthView.as_view(), name="analytics-user-growth"),
    path("plan-distribution", PlanDistributionView.as_view(), name="analytics-plan-dist"),
]
