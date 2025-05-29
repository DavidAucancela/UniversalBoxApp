from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RolViewSet, RegistroView, PerfilView
from .serializers import CustomTokenObtainPairSerializer


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)
router.register(r'roles', RolViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/registro/', RegistroView.as_view(), name='registro'),
    path('api/perfil/', PerfilView.as_view(), name='perfil'),

    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]