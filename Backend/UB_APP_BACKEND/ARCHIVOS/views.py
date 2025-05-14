from django.shortcuts import render
from rest_framework import viewsets
from ARCHIVOS.models import Factura
from ARCHIVOS.serializers import FacturaSerializer
from rest_framework.permissions import AllowAny


class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    permission_classes = [AllowAny] # any user can show this viewset