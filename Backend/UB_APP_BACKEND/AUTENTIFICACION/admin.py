from django.contrib import admin
from .models import Usuario, Rol

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'apellido', 'correo', 'estado', 'fechaRegistro', 'get_rol']

    def get_rol(self, obj):
        return obj.rol.nombre  # Asumiendo que 'nombre' es un campo del modelo Rol
    get_rol.short_description = 'Rol'

