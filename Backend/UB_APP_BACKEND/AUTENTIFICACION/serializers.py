from rest_framework import serializers
from .models import Usuario, Rol

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    rol = RolSerializer(read_only=True)
    rol_id = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), source='rol', write_only=True)

    class Meta:
        model = Usuario
        fields = ['idUsuario', 'nombre', 'apellido', 'hashContraseña', 'correo', 'estado', 'fechaRegistro', 'ultimoAcceso', 'rol', 'rol_id']