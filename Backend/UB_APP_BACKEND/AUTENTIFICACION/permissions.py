from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Permiso para solo permitir acceso a usuarios con rol 'Admin'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'rol') and request.user.rol and request.user.rol.nombre == 'Admin'
