# from django.shortcuts import render
from rest_framework import viewsets 
# from rest_framework.permissions import AllowAny

from .models import Usuario, Rol
from .serializers import UsuarioSerializer, RolSerializer

from django.http import HttpResponse

class UserViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    # permission_classes = [AllowAny] # cualquiera
    # permission_classes = [isAutenticated] # modificar la importacion


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer


def helloworld(request):
    return HttpResponse("estas acá")