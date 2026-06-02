from rest_framework import viewsets
from .models import Plan
from .serializers import PlanSerializer
from apps.users.permissions import IsSuperAdmin


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.prefetch_related("subscriptions")
    serializer_class = PlanSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return Plan.objects.all()
