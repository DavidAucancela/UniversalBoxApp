from django.contrib import admin
from .models import Usuario, Rol

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'apellido', 'correo', 'estado', 'fechaRegistro', 'get_rol']
    list_filter = ('estado', 'rol')  # Filtros por estado y rol
    search_fields = ('nombre', 'apellido', 'correo')  # Búsqueda por estos campos
    ordering = ('-fechaRegistro',)  # Ordenar por fecha descendente

    # Campo personalizado para mostrar el rol
    def get_rol(self, obj):
        return obj.rol.nombre if obj.rol else "Sin rol"
    get_rol.short_description = 'Rol'  # Nombre de columna en el admin


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ('nombre',)






 