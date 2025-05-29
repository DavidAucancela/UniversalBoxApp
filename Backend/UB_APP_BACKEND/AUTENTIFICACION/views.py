# from django.shortcuts import render
from rest_framework import viewsets, permissions, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Usuario, Rol
from .serializers import UsuarioSerializer, RolSerializer

from django.http import HttpResponse
from .permissions import IsAdminRole

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


    def get(self, request):
        return Response({"mensaje": "Esta vista está protegida!"})
    

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

class RegistroView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class PerfilView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UsuarioSerializer

    def get_object(self):
        return self.request.user

class HelloView(APIView):
    def get(self, request):
        return Response({"message": "Hola desde Django API"})

class VistaSoloAdmin(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({"mensaje": "¡Solo admins pueden ver esto!"})