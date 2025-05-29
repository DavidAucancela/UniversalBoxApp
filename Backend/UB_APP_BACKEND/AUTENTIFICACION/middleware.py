from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import redirect

class RolMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        # URLs que no requieren verificación de rol (login, admin, etc.)
        excluded_paths = ['/admin/', '/api/token/', '/login/']
        if any(request.path.startswith(path) for path in excluded_paths):
            return None

        # Si el usuario no está autenticado, devolver un error 401
        if not request.user.is_authenticated:
            return JsonResponse({'detail': 'No autenticado'}, status=401)

        # Verificar rol (ejemplo: solo "Admin" puede acceder a ciertas vistas)
        if hasattr(request.user, 'rol') and request.user.rol.nombre != 'Admin':
            return HttpResponseForbidden("Acceso denegado: se requiere rol de Administrador.")
        return None