from rest_framework.views import APIView
from rest_framework.response import Response
from apps.users.permissions import IsSuperAdmin


class SettingsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response(
            {
                "app_name": "NexaAdmin",
                "support_email": "admin@nexasaas.io",
                "billing_currency": "USD",
                "maintenance_mode": False,
            }
        )

    def patch(self, request):
        return Response(request.data)
