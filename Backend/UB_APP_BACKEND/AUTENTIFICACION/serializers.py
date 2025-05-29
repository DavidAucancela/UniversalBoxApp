from rest_framework import serializers
from .models import Usuario, Rol
from rest_framework import permissions
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class IsAdminRole(permissions.BasePermission):
    """
    Permiso para solo permitir acceso a usuarios con rol 'Admin'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'rol') and request.user.rol and request.user.rol.nombre == 'Admin'

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    rol = RolSerializer(read_only=True)
    rol_id = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), source='rol', write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['idUsuario', 'nombre', 'apellido', 'password', 'correo', 'estado', 'fechaRegistro', 'ultimoAcceso', 'rol', 'rol_id']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = Usuario(
            nombre=validated_data['nombre'],
            apellido=validated_data['apellido'],
            correo=validated_data['correo'],
            estado=validated_data.get('estado', True),  # Default to True if not provided
            rol=validated_data['rol'],  # Use the Rol instance directly
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        # Cambia 'email' por 'correo' si tu modelo lo usa así
        attrs['username'] = attrs.get('email') or attrs.get('correo')
        return super().validate(attrs)