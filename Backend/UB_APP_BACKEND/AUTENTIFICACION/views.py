from django.shortcuts import render
from .models import Usuario
from rest_framework import viewsets # disminuye el codigo
from AUTENTIFICACION.serializers import UsuarioSerializer
from rest_framework.permissions import AllowAny

class UserViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [AllowAny] # any user can show this viewset

